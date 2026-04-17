const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'No token provided' });

  // Strip "Bearer " prefix if present
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access only' });
  next();
};

// User only
const userOnly = (req, res, next) => {
  if (req.user.role !== 'user')
    return res.status(403).json({ message: 'User access only' });
  next();
};

module.exports = { verifyToken, adminOnly, userOnly };