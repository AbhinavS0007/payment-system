const router = require('express').Router();
const RequestLink = require('../models/RequestLink');
const { protect } = require('../middleware/auth');

router.use(protect);

const MAX_HOURS = 48; // hard cap — nothing outlives 48h

const shape = (l) => ({
  _id: l._id,
  token: l.token,
  createdByName: l.createdByName,
  expiresAt: l.expiresAt,
  used: l.used,
  usedAt: l.usedAt,
  request: l.request,
  active: !l.used && l.expiresAt > new Date(),
  createdAt: l.createdAt
});

// GET /api/request-links  — my links (newest first)
router.get('/', async (req, res) => {
  const links = await RequestLink.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(links.map(shape));
});

// POST /api/request-links  — generate a one-time link
router.post('/', async (req, res) => {
  let hours = Number(req.body.expiresInHours) || MAX_HOURS;
  if (hours < 1) hours = 1;
  if (hours > MAX_HOURS) hours = MAX_HOURS;
  const link = await RequestLink.create({
    token: RequestLink.newToken(),
    createdBy: req.user._id,
    createdByName: req.user.name,
    expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000)
  });
  res.status(201).json(shape(link));
});

// POST /api/request-links/expire-all  — kill active links
// Body { global: true } (admin only) expires everyone's; otherwise just mine.
router.post('/expire-all', async (req, res) => {
  const global = req.body.global === true;
  if (global && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only an admin can expire everyone\'s links.' });
  }
  const filter = { used: false, expiresAt: { $gt: new Date() } };
  if (!global) filter.createdBy = req.user._id;
  const result = await RequestLink.updateMany(filter, { $set: { expiresAt: new Date() } });
  res.json({ expired: result.modifiedCount, scope: global ? 'all' : 'mine' });
});

module.exports = router;
