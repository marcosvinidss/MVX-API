const User = require('../models/User');

function extractToken(req) {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string') {
    const parts = auth.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1].trim();
    if (auth.trim()) return auth.trim();
  }
  if (req.query && typeof req.query.token === 'string' && req.query.token.trim()) return req.query.token.trim();
  if (req.body && typeof req.body.token === 'string' && req.body.token.trim()) return req.body.token.trim();
  return null;
}

module.exports = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next(); // rota segue pública

    const user = await User.findOne({ token }).select('_id favorites');
    if (user) {
      req.user = user;               // doc do mongoose (compat)
      req.userId = String(user._id); // atalho
    }
    return next();
  } catch (e) {
    console.error('[OptionalAuth]', e);
    return next(); // nunca bloqueia
  }
};
