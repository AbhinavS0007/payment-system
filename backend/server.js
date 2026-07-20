require('dotenv').config();
require('express-async-errors'); // lets async route errors reach the handler below instead of hanging
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => res.json({ app: 'Blue Isle Payments API', status: 'running' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

// Central error handler
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Request not found.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Invalid data.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
