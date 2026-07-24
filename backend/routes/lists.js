const { protect, allow } = require('../middleware/auth');

// Builds a CRUD router for a simple managed { name } list.
// Everyone logged in can read (for dropdowns); only operations & admin can edit.
module.exports = function managedListRouter(Model, label) {
  const router = require('express').Router();
  router.use(protect);

  // GET /  — list, alphabetical (used to populate dropdowns)
  router.get('/', async (req, res) => {
    const items = await Model.find().sort({ name: 1 });
    res.json(items);
  });

  const editors = allow('operations', 'admin');

  // POST /  — add
  router.post('/', editors, async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: `${label} name is required.` });
    const exists = await Model.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(400).json({ message: `That ${label.toLowerCase()} already exists.` });
    const item = await Model.create({ name });
    res.status(201).json(item);
  });

  // PUT /:id  — rename
  router.put('/:id', editors, async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: `${label} name is required.` });
    const clash = await Model.findOne({ name: new RegExp(`^${name}$`, 'i'), _id: { $ne: req.params.id } });
    if (clash) return res.status(400).json({ message: `That ${label.toLowerCase()} already exists.` });
    const item = await Model.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!item) return res.status(404).json({ message: `${label} not found.` });
    res.json(item);
  });

  // DELETE /:id
  router.delete('/:id', editors, async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: `${label} not found.` });
    res.json({ ok: true });
  });

  return router;
};
