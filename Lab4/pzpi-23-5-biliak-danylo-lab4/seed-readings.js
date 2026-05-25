const pool = require('./src/database');

// Helper function to generate smooth, realistic fluctuations
function generateFluctuations(baseValue, count, hours, period = 24) {
  const values = [];
  // Make the random trend less aggressive
  const hourlyChangeFactor = (Math.random() - 0.5) * 0.1;
  // Ensure amplitude is noticeable even for low base values. Use at least 3 degree/percent swing.
  const amplitude = Math.max(3, baseValue * 0.15); // Increased to 15% and minimum of 3

  for (let i = 0; i < count; i++) {
    const hour = (hours / count) * i;
    // Sine wave to simulate daily cycle. Starts at the low point.
    const sineWave = Math.sin((hour / period) * 2 * Math.PI - Math.PI / 2);
    const fluctuation = amplitude * sineWave;
    const trend = hourlyChangeFactor * hour;
    // Add a little bit of noise to make it less perfectly smooth
    const noise = (Math.random() - 0.5) * 0.25;
    values.push(baseValue + fluctuation + trend + noise);
  }
  return values;
}


async function seedReadings(sensorId, count = 50) {
  console.log(`Attempting to seed ${count} new readings for sensor ${sensorId}.`);

  // 1. Get the last reading to use as a baseline
  const { rows } = await pool.query('SELECT * FROM sensor_readings WHERE sensor_id = $1 ORDER BY created_at DESC LIMIT 1', [sensorId]);
  const lastReading = rows[0];
  
  let baseTemp, baseHumidity, basePressure, lastTimestamp;

  if (lastReading) {
    console.log('Found last reading:', lastReading);
    baseTemp = lastReading.temperature;
    baseHumidity = lastReading.humidity;
    basePressure = lastReading.pressure;
    lastTimestamp = new Date(lastReading.created_at).getTime();
  } else {
    console.log('No previous readings found. Using default baseline values.');
    baseTemp = 20; // ~20°C
    baseHumidity = 50; // 50%
    basePressure = 1013; // ~1 atm
    lastTimestamp = new Date().getTime();
  }
  
  // 2. Generate new values
  const hours = count * 0.5; // Total hours covered by the readings
  const temps = generateFluctuations(baseTemp, count, hours);
  // Humidity often has an inverse relationship with temperature
  const humidities = generateFluctuations(baseHumidity, count, hours, 36).map(h => 100 - (100 - h) * 0.8);
  const pressures = generateFluctuations(basePressure, count, hours, 48);

  const timeIncrement = 30 * 60 * 1000; // 30 minutes in milliseconds

  // 3. Insert new readings
  const insertSql = `INSERT INTO sensor_readings (sensor_id, temperature, humidity, pressure, created_at) VALUES ($1, $2, $3, $4, $5)`;
  
  let insertedCount = 0;
  for (let i = 0; i < count; i++) {
    const newTimestamp = new Date(lastTimestamp + timeIncrement * (i + 1));
    const params = [
      sensorId,
      parseFloat(temps[i].toFixed(2)),
      parseFloat(humidities[i].toFixed(2)),
      parseFloat(pressures[i].toFixed(2)),
      newTimestamp.toISOString()
    ];

    await pool.query(insertSql, params);
    insertedCount++;
  }
  
  console.log(`Successfully inserted ${insertedCount} new readings.`);
}

// Main execution
(async () => {
  const sensorId = process.argv[2];
  const count = process.argv[3] ? parseInt(process.argv[3], 10) : 50;

  if (!sensorId) {
    console.error('Error: Please provide a sensorId as the first argument.');
    console.log('Usage: node seed-readings.js <sensorId> [count]');
    try {
        const { rows } = await pool.query('SELECT id, name FROM sensors');
        console.log('\nAvailable sensors:');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Could not fetch available sensors:', err);
    }
    await pool.end();
    return;
  }

  try {
    await seedReadings(sensorId, count);
  } catch (err) {
    console.error('Failed to seed database:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
})();
