const router = require('express').Router();
const Setting = require('../models/Setting');
const { protect, allow } = require('../middleware/auth');

router.use(protect);

// GET /api/settings  — anyone logged in can read (frontend needs threshold)
router.get('/', async (req, res) => {
  const directorThreshold = await Setting.get('directorThreshold', 50000);
  res.json({ directorThreshold });
});

// PUT /api/settings  — director only
router.put('/', allow('director'), async (req, res) => {
  const { directorThreshold } = req.body;
  if (directorThreshold !== undefined) {
    await Setting.set('directorThreshold', Number(directorThreshold));
  }
  res.json({ directorThreshold: await Setting.get('directorThreshold', 50000) });
});

module.exports = router;
