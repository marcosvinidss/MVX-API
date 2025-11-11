// src/middlewares/Auth.js
const User = require('../models/User');

function extractToken(req) {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.trim()) {
    const parts = auth.trim().split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1].trim();
    return auth.trim();
  }
  if (req.query && typeof req.query.token === 'string' && req.query.token.trim()) return req.query.token.trim();
  if (req.body && typeof req.body.token === 'string' && req.body.token.trim()) return req.body.token.trim();
  return null;
}

module.exports = {
  private: async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) return res.status(401).json({ notallowed: true, message: 'Token not provided' });
      const user = await User.findOne({ token }).select('_id name email role favorites token');
      if (!user) return res.status(401).json({ notallowed: true, message: 'Unauthorized: Invalid token' });
      req.user = user;
      req.userId = String(user._id);
      next();
    } catch (err) {
      console.error('[Auth.private]', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
