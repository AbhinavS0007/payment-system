const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }
  if (!user.active) {
    return res.status(403).json({ message: 'This account has been deactivated.' });
  }
  res.json({
    token: sign(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  const { _id, name, email, role } = req.user;
  res.json({ id: _id, name, email, role });
});

module.exports = router;
