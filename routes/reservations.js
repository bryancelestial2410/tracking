const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// ── GET ALL RESERVATIONS (Admin only) ─────────────────────
router.get('/', verifyToken, adminOnly, (req, res) => {
  const query = `
    SELECT 
      r.id,
      u.name AS user_name,
      u.email AS user_email,
      r.instructor,
      r.section,
      r.room,
      r.course,
      r.date_reservation,
      r.date_need,
      r.date_return,
      r.lab_procedure,
      r.equipment,
      r.mannequins,
      r.status,
      r.reserved_at,
      r.returned_at
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.reserved_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('GET ALL ERROR:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const data = results.map(row => ({
      ...row,
      equipment: typeof row.equipment === 'string'
        ? JSON.parse(row.equipment)
        : row.equipment
    }));

    res.json(data);
  });
});

// ── GET MY RESERVATIONS (Logged-in user) ──────────────────
router.get('/my', verifyToken, (req, res) => {
  const query = `
    SELECT 
      r.id,
      r.instructor,
      r.section,
      r.room,
      r.course,
      r.date_reservation,
      r.date_need,
      r.date_return,
      r.lab_procedure,
      r.equipment,
      r.mannequins,
      r.status,
      r.reserved_at,
      r.returned_at
    FROM reservations r
    WHERE r.user_id = ?
    ORDER BY r.reserved_at DESC
  `;
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('GET MY ERROR:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const data = results.map(row => ({
      ...row,
      equipment: typeof row.equipment === 'string'
        ? JSON.parse(row.equipment)
        : row.equipment
    }));

    res.json(data);
  });
});

// ── CREATE RESERVATION (User) ──────────────────────────────
router.post('/', verifyToken, (req, res) => {
  const {
    instructor,
    section,
    room,
    course,
    date_reservation,
    date_need,
    date_return,
    procedure: lab_procedure,
    equipment,
    mannequins,
    checklist
  } = req.body;

  const user_id = req.user.id;

  if (!instructor || !section || !room || !course || !date_reservation || !date_need || !date_return) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  const equipmentJSON = JSON.stringify(equipment || []);
  const mannequinsVal = mannequins || '0';

  db.query(
    `INSERT INTO reservations 
      (user_id, instructor, section, room, course, date_reservation, date_need, date_return, lab_procedure, equipment, mannequins, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [user_id, instructor, section, room, course, date_reservation, date_need, date_return, lab_procedure || 'N/A', equipmentJSON, mannequinsVal],
    (err, result) => {
      if (err) {
        console.error('INSERT ERROR:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: '✅ Reservation submitted successfully!', id: result.insertId });
    }
  );
});

// ── APPROVE RESERVATION (Admin only) ──────────────────────
router.put('/:id/approve', verifyToken, adminOnly, (req, res) => {
  const id = req.params.id;
  console.log('APPROVE HIT - id:', id, 'user:', req.user);

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid reservation ID' });
  }

  db.query(`SELECT id, status FROM reservations WHERE id = ?`, [id], (err, results) => {
    if (err) {
      console.error('APPROVE SELECT ERROR:', err);
      return res.status(500).json({ error: 'Database error during lookup', detail: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const reservation = results[0];
    const status = reservation.status?.toLowerCase().trim();

    console.log('APPROVE - current status:', status);

    if (status !== 'pending') {
      return res.status(400).json({ message: `Reservation is already ${reservation.status}` });
    }

    db.query(
      `UPDATE reservations SET status = 'approved' WHERE id = ?`,
      [id],
      (err, result) => {
        if (err) {
          console.error('APPROVE UPDATE ERROR:', err);
          return res.status(500).json({ error: 'Database error during approval', detail: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Reservation not found or already updated' });
        }

        console.log('APPROVE SUCCESS - id:', id);
        res.json({ message: '✅ Reservation approved!' });
      }
    );
  });
});

// ── MARK AS BORROWED (Admin only) ─────────────────────────
router.put('/:id/borrow', verifyToken, adminOnly, (req, res) => {
  console.log('BORROW HIT - id:', req.params.id);

  db.query(`SELECT * FROM reservations WHERE id = ?`, [req.params.id], (err, results) => {
    if (err) {
      console.error('BORROW SELECT ERROR:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0)
      return res.status(404).json({ message: 'Reservation not found' });

    db.query(
      `UPDATE reservations SET status = 'borrowed' WHERE id = ?`,
      [req.params.id],
      (err) => {
        if (err) {
          console.error('BORROW UPDATE ERROR:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: '✅ Marked as borrowed!' });
      }
    );
  });
});

// ── RETURN (Admin only) ───────────────────────────────────
router.put('/:id/return', verifyToken, adminOnly, (req, res) => {
  console.log('RETURN HIT - id:', req.params.id);

  db.query(`SELECT * FROM reservations WHERE id = ?`, [req.params.id], (err, results) => {
    if (err) {
      console.error('RETURN SELECT ERROR:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0)
      return res.status(404).json({ message: 'Reservation not found' });

    if (results[0].status !== 'borrowed')
      return res.status(400).json({ message: 'Reservation is not currently borrowed' });

    db.query(
      `UPDATE reservations SET status = 'returned', returned_at = NOW() WHERE id = ?`,
      [req.params.id],
      (err) => {
        if (err) {
          console.error('RETURN UPDATE ERROR:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: '✅ Equipment returned successfully!' });
      }
    );
  });
});

// ── CANCEL RESERVATION (Owner or Admin) ───────────────────
router.put('/:id/cancel', verifyToken, (req, res) => {
  console.log('CANCEL HIT - id:', req.params.id);

  db.query(`SELECT * FROM reservations WHERE id = ?`, [req.params.id], (err, results) => {
    if (err) {
      console.error('CANCEL SELECT ERROR:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0)
      return res.status(404).json({ message: 'Reservation not found' });

    const reservation = results[0];

    if (req.user.role !== 'admin' && reservation.user_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });

    if (reservation.status !== 'pending')
      return res.status(400).json({ message: 'Only pending reservations can be cancelled' });

    db.query(
      `UPDATE reservations SET status = 'cancelled' WHERE id = ?`,
      [req.params.id],
      (err) => {
        if (err) {
          console.error('CANCEL UPDATE ERROR:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: '✅ Reservation cancelled!' });
      }
    );
  });
});

// ── DELETE RESERVATION (Admin only) ───────────────────────
router.delete('/:id', verifyToken, adminOnly, (req, res) => {
  console.log('DELETE HIT - id:', req.params.id);

  db.query(`SELECT * FROM reservations WHERE id = ?`, [req.params.id], (err, results) => {
    if (err) {
      console.error('DELETE SELECT ERROR:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0)
      return res.status(404).json({ message: 'Reservation not found' });

    db.query(`DELETE FROM reservations WHERE id = ?`, [req.params.id], (err) => {
      if (err) {
        console.error('DELETE ERROR:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: '✅ Reservation deleted!' });
    });
  });
});

module.exports = router;