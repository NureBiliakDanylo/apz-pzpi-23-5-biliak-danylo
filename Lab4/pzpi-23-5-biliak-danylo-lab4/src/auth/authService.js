const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-weather-key';

const register = async (req, res) => {
    const { username, password, role } = req.body;
    
    // Default role is junior_admin if not specified, but first user should be admin
    // Or we can just let the admin create others.
    // The request says: "Junior Admin (view/delete sensors), DB Admin (dumps), and Admin (everything)"
    // "add new junior admins and db admins through the regular admin panel"
    
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password and role are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
            [username, hashedPassword, role]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: user.role });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const checkStatus = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT COUNT(*) FROM users');
        res.json({ registered: parseInt(rows[0].count) > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

const listUsers = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('List users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, checkStatus, authenticate, authorize, listUsers, deleteUser };
