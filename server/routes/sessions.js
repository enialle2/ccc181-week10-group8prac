const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../data/users');

router.post('/', (req, res) => {
  const { email, password } = req.body || {};

  // 1. Both must be text, and the email must look like an email
  const looksLikeEmail = typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email.trim());
  if (!looksLikeEmail || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // 2. Find the user (email in lowercase)
  const user = users.find(u => u.email === email.trim().toLowerCase());

  // 3 and 4. Compare with the hash; the same 401 message for both cases
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // 5. Token valid for 1 hour, then 200 with token and user
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
