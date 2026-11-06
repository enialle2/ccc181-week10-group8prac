const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// 1. Middleware
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// 2. Pre-loaded demo user list (with pre-hashed password for "Campus26")
// bcrypt.hashSync("Campus26", 10) generates this hash
const users = [
  {
    id: 1,
    name: "Demo Student",
    email: "student@campusconnect.test",
    passwordHash: bcrypt.hashSync("Campus26", 10)
  }
];

// 3. Required Endpoints

// GET /api/v1/health - Check if the API is running
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// POST /api/v1/sessions - Handle user login
app.post('/api/v1/sessions', (req, res) => {
  const { email, password } = req.body;

  // Validate request body
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Find user by normalized email (lowercase)
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email === normalizedEmail);

  // If user does not exist or password doesn't match, return 401
  // (Use the exact same message to prevent leaking whether an email exists)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // Create a JWT token expiring in 1 hour
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Success response
  return res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// Authentication Middleware for protected routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Not logged in." });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Not logged in." });
  }
};

// GET /api/v1/users/me - Return logged-in user details
app.get('/api/v1/users/me', verifyToken, (req, res) => {
  return res.status(200).json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  });
});

// 4. Fallback Handlers for Unknown Routes and Errors
app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});