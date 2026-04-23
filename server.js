const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Proper CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Must have this to read req.body
app.use(express.json());

// ── ROUTES ─────────────────────────────────────────────────
app.use('/auth',         require('./routes/auth'));
app.use('/tools',        require('./routes/tools'));
app.use('/reservations', require('./routes/reservations'));

// ── HEALTH CHECK ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '✅ NCF CHS-CSR Backend is running!' });
});

// ── START SERVER (local only) ──────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// ✅ For Vercel
module.exports = app;