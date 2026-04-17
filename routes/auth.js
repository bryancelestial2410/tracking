const express = require('express');
const router = express.Router();
const db = require('../db');  // ✅ correct
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// ── REGISTER ──────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if email exists
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length > 0)
      return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user (role defaults to 'user' unless specified)
    const userRole = role === 'admin' ? 'admin' : 'user';
    db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userRole],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: '✅ Registered successfully!', id: result.insertId });
      }
    );
  });
});

// ── LOGIN ─────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = results[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect password' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: '✅ Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

module.exports = router;
