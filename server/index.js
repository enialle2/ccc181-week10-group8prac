require('dotenv').config();
const express = require('express');
const cors = require('cors');

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Copy server/.env.example to server/.env');
  process.env.JWT_SECRET = 'fallback_secret';
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/v1/health', require('./routes/health'));
app.use('/api/v1/sessions', require('./routes/sessions'));
// Member 2 adds below: /api/v1/users, then notFound and errorHandler

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
