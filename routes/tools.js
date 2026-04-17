const express = require('express');
const router = express.Router();
const db = require('../db');  // ✅ correct
const { verifyToken, adminOnly } = require('../middleware/auth');

// ── GET ALL TOOLS (Admin & User) ──────────────────────────
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM tools', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ── GET SINGLE TOOL ───────────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {
  db.query('SELECT * FROM tools WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ message: 'Tool not found' });
    res.json(results[0]);
  });
});

// ── GET AVAILABLE TOOLS ONLY (User) ──────────────────────
router.get('/status/available', verifyToken, (req, res) => {
  db.query("SELECT * FROM tools WHERE status = 'available'", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ── ADD NEW TOOL (Admin only) ─────────────────────────────
router.post('/', verifyToken, adminOnly, (req, res) => {
  const { name, description } = req.body;

  if (!name)
    return res.status(400).json({ message: 'Tool name is required' });

  db.query(
    'INSERT INTO tools (name, description) VALUES (?, ?)',
    [name, description],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: '✅ Tool added!', id: result.insertId });
    }
  );
});

// ── UPDATE TOOL (Admin only) ──────────────────────────────
router.put('/:id', verifyToken, adminOnly, (req, res) => {
  const { name, description, status } = req.body;

  // Check tool exists
  db.query('SELECT * FROM tools WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ message: 'Tool not found' });

    const updatedName = name || results[0].name;
    const updatedDesc = description || results[0].description;
    const updatedStatus = status || results[0].status;

    db.query(
      'UPDATE tools SET name = ?, description = ?, status = ? WHERE id = ?',
      [updatedName, updatedDesc, updatedStatus, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: '✅ Tool updated!' });
      }
    );
  });
});

// ── DELETE TOOL (Admin only) ──────────────────────────────
router.delete('/:id', verifyToken, adminOnly, (req, res) => {
  db.query('SELECT * FROM tools WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ message: 'Tool not found' });

    db.query('DELETE FROM tools WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: '✅ Tool deleted!' });
    });
  });
});

module.exports = router;