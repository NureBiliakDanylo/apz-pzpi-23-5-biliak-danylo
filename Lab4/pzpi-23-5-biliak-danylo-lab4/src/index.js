require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const pool = require('./database.js');
const { generateLocalForecast } = require('./localForecast.js');
const swaggerUi = require('swagger-ui-express');
const specs = require('../swagger.js');
const { register, login, checkStatus, authenticate, authorize, listUsers, deleteUser } = require('./auth/authService');
const { downloadDump, createBackup, listBackups, restoreBackup } = require('./admin/adminService');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Auth routes
app.get('/auth/status', checkStatus);
app.post('/auth/register', register); // This will be used for the first admin registration
app.post('/auth/login', login);

// Admin-only: User management
app.get('/admin/users', authenticate, authorize(['admin']), listUsers);
app.post('/admin/users', authenticate, authorize(['admin']), register);
app.delete('/admin/users/:id', authenticate, authorize(['admin']), deleteUser);

// Protected Admin routes
app.get('/admin/dump', authenticate, authorize(['admin', 'db_admin']), downloadDump);

// Backup routes
app.post('/admin/backups', authenticate, authorize(['admin', 'db_admin']), createBackup);
app.get('/admin/backups', authenticate, authorize(['admin', 'db_admin']), listBackups);
app.post('/admin/backups/restore', authenticate, authorize(['admin', 'db_admin']), restoreBackup);

// Sensor management
app.get('/admin/sensors', authenticate, authorize(['admin', 'junior_admin']), async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const { rows: sensors } = await pool.query(
      `SELECT id, name, location, api_key, created_at, last_seen_at FROM sensors ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const { rows: countResult } = await pool.query(`SELECT COUNT(*) FROM sensors`);
    res.status(200).json({ sensors, total: parseInt(countResult[0].count) });
  } catch (err) {
    console.error('Error fetching sensors', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensors' });
  }
});

app.delete('/admin/sensors/:id', authenticate, authorize(['admin', 'junior_admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM sensors WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    res.status(200).json({ message: 'Sensor deleted successfully' });
  } catch (err) {
    console.error('Error deleting sensor', err.stack);
    return res.status(500).json({ error: 'Failed to delete sensor' });
  }
});

app.get('/admin/sensors/:id/readings', authenticate, authorize(['admin', 'junior_admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const sensorCheck = await pool.query(`SELECT id FROM sensors WHERE id = $1`, [id]);
    if (sensorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    const { rows } = await pool.query(`SELECT id, sensor_id, temperature, humidity, pressure, created_at FROM sensor_readings WHERE sensor_id = $1`, [id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensor readings', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensor readings' });
  }
});

// Public / Sensor routes
app.get('/sensors', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, name, location, last_seen_at FROM sensors`);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensors', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensors' });
  }
});

app.post('/sensors', async (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'Name and location are required' });
  const id = uuidv4();
  const apiKey = uuidv4();
  const sql = `INSERT INTO sensors (id, name, location, api_key) VALUES ($1, $2, $3, $4)`;
  try {
    await pool.query(sql, [id, name, location, apiKey]);
    res.status(201).json({ id, name, location, api_key: apiKey });
  } catch (err) {
    console.error('Error inserting sensor', err.stack);
    return res.status(500).json({ error: 'Failed to register sensor' });
  }
});

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API Key is required' });
  try {
    const { rows } = await pool.query(`SELECT * FROM sensors WHERE api_key = $1`, [apiKey]);
    const sensor = rows[0];
    if (!sensor) return res.status(403).json({ error: 'Invalid API Key' });
    req.sensor = sensor;
    next();
  } catch (err) {
    console.error('Error authenticating API key', err.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

app.post('/readings', authenticateApiKey, async (req, res) => {
  const { temperature, humidity, pressure } = req.body;
  const sensor_id = req.sensor.id;
  if (temperature === undefined || humidity === undefined || pressure === undefined) {
    return res.status(400).json({ error: 'Temperature, humidity, and pressure are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertReadingSql = `INSERT INTO sensor_readings (sensor_id, temperature, humidity, pressure) VALUES ($1, $2, $3, $4) RETURNING id`;
    const readingResult = await client.query(insertReadingSql, [sensor_id, temperature, humidity, pressure]);
    const updateSensorSql = `UPDATE sensors SET last_seen_at = NOW() WHERE id = $1`;
    await client.query(updateSensorSql, [sensor_id]);
    await client.query('COMMIT');
    res.status(201).json({ message: 'Sensor reading recorded', id: readingResult.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting sensor reading', err.stack);
    return res.status(500).json({ error: 'Failed to record sensor reading' });
  } finally {
    client.release();
  }
});

app.get('/locations/:location_name', async (req, res) => {
  const { location_name } = req.params;
  const sql = `SELECT id, name, location, last_seen_at FROM sensors WHERE location ILIKE $1`;
  try {
    const { rows } = await pool.query(sql, [`%${location_name}%`]);
    if (rows.length === 0) return res.status(404).json({ error: 'No sensors found for this location' });
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensors by location', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensors' });
  }
});

app.get('/local-forecasts/:sensor_id', async (req, res) => {
  const { sensor_id } = req.params;
  const hoursAhead = req.query.hours_ahead ? parseInt(req.query.hours_ahead, 10) : 1;
  if (isNaN(hoursAhead) || hoursAhead <= 0) return res.status(400).json({ error: 'Invalid hours_ahead parameter.' });
  try {
    const forecast = await generateLocalForecast(sensor_id, hoursAhead);
    if (forecast) res.json(forecast);
    else res.status(404).json({ error: 'Not enough data to generate a local forecast.' });
  } catch (error) {
    console.error('Error generating local forecast', error.stack);
    res.status(500).json({ error: 'Failed to generate local forecast' });
  }
});

app.get('/sensors/:id/readings', async (req, res) => {
  const { id } = req.params;
  try {
    const sensorCheck = await pool.query(`SELECT id FROM sensors WHERE id = $1`, [id]);
    if (sensorCheck.rows.length === 0) return res.status(404).json({ error: 'Sensor not found' });
    const { rows } = await pool.query(`SELECT id, sensor_id, temperature, humidity, pressure, created_at FROM sensor_readings WHERE sensor_id = $1`, [id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensor readings', err.stack);
    return res.status(500).json({ error: 'Failed to retrieve sensor readings' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
