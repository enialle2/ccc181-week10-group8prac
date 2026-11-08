const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';   // "Bearer <token>"
  const [scheme, token] = header.split(' ');

  // Missing header or wrong format
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  try {
    // Must be the SAME secret used in jwt.sign() inside routes/sessions.js
    const payload = jwt.verify(token, process.env.JWT_SECRET); // throws if wrong or expired
    req.userId = payload.id;                                    // needs { id: user.id } in the token
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
}

module.exports = requireAuth;