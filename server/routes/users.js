const express = require('express');
const users = require('../data/users');
const requireAuth = require('../middleware/requireAuth');
 
const router = express.Router();
 
// GET /api/v1/users/me  (the full address is set in index.js)
router.get('/me', requireAuth, (req, res) => {
  const user = users.find((u) => u.id === req.userId);
 
  if (!user) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
 
  // Never send passwordHash
  res.status(200).json({ id: user.id, name: user.name, email: user.email });
});
 
module.exports = router;