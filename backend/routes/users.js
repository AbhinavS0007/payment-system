const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, allow } = require('../middleware/auth');

router.use(protect, allow('director'));

// GET /api/users
router.get('/', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// POST /api/users  — create team member
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(400).json({ message: 'An account with this email already exists.' });
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: role || 'employee'
  });
  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

// PUT /api/users/:id  — change role / activate / deactivate / reset password
router.put('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const { role, active, password } = req.body;
  if (role) user.role = role;
  if (active !== undefined) user.active = active;
  if (password) user.password = await bcrypt.hash(password, 10);
  await user.save();
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role, active: user.active });
});

module.exports = router;
