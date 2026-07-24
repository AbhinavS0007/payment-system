const router = require('express').Router();
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const Setting = require('../models/Setting');
const validateLists = require('../utils/validateLists');
const { protect, allow } = require('../middleware/auth');

router.use(protect);

const log = (request, action, user, remarks = '') =>
  ActivityLog.create({
    request: request._id,
    requestCode: request.code,
    action,
    remarks,
    by: user._id,
    byName: user.name,
    byRole: user.role
  });

const populated = (query) =>
  query
    .populate('requester', 'name email role')
    .populate('financeAction.by', 'name')
    .populate('operationsAction.by', 'name')
    .populate('adminAction.by', 'name')
    .populate('payment.by', 'name');

// GET /api/requests  — employees see their own; finance/operations/admin see all
router.get('/', async (req, res) => {
  const { status, category, project, from, to } = req.query;
  const filter = {};
  if (req.user.role === 'employee') filter.requester = req.user._id;
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (project) filter.project = new RegExp(project, 'i');
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59');
  }
  const requests = await populated(Request.find(filter).sort({ createdAt: -1 }));
  res.json(requests);
});

// GET /api/requests/:id
router.get('/:id', async (req, res) => {
  const request = await populated(Request.findById(req.params.id));
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (req.user.role === 'employee' && String(request.requester._id) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only view your own requests.' });
  }
  const logs = await ActivityLog.find({ request: request._id }).sort({ createdAt: 1 });
  res.json({ request, logs });
});

// POST /api/requests  — create (draft or submit directly)
router.post('/', async (req, res) => {
  const { payeeName, payeeDetails, payeeQrUrl, amount, category, project, urgency, description, attachmentUrl, billPhotoUrl, submit } = req.body;
  if (!payeeName || !amount || !category || !project) {
    return res.status(400).json({ message: 'Payee, amount, category and project are required.' });
  }
  const listError = await validateLists(category, project);
  if (listError) return res.status(400).json({ message: listError });
  const threshold = await Setting.get('directorThreshold', 50000);
  const request = await Request.create({
    payeeName, payeeDetails, payeeQrUrl, amount, category, project, urgency, description, attachmentUrl, billPhotoUrl,
    requester: req.user._id,
    needsAdmin: amount > threshold,
    status: submit ? 'submitted' : 'draft'
  });
  await log(request, 'created', req.user);
  if (submit) await log(request, 'submitted', req.user);
  res.status(201).json(request);
});

// PUT /api/requests/:id  — edit own draft / sent_back
router.put('/:id', async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (String(request.requester) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only edit your own requests.' });
  }
  if (!['draft', 'sent_back'].includes(request.status)) {
    return res.status(400).json({ message: 'Only drafts or sent-back requests can be edited.' });
  }
  const fields = ['payeeName', 'payeeDetails', 'payeeQrUrl', 'amount', 'category', 'project', 'urgency', 'description', 'attachmentUrl', 'billPhotoUrl'];
  fields.forEach((f) => { if (req.body[f] !== undefined) request[f] = req.body[f]; });
  const listError = await validateLists(request.category, request.project);
  if (listError) return res.status(400).json({ message: listError });
  const threshold = await Setting.get('directorThreshold', 50000);
  request.needsAdmin = request.amount > threshold;
  await request.save();
  await log(request, 'edited', req.user);
  res.json(request);
});

// POST /api/requests/:id/submit  — draft or sent_back -> submitted
router.post('/:id/submit', async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (String(request.requester) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only submit your own requests.' });
  }
  if (!['draft', 'sent_back'].includes(request.status)) {
    return res.status(400).json({ message: 'This request has already been submitted.' });
  }
  request.status = 'submitted';
  request.financeAction = undefined;
  request.operationsAction = undefined;
  request.adminAction = undefined;
  await request.save();
  await log(request, 'submitted', req.user, req.body.remarks);
  res.json(request);
});

// POST /api/requests/:id/finance  — approve | reject | send_back (finance or admin)
router.post('/:id/finance', allow('finance', 'admin'), async (req, res) => {
  const { decision, remarks } = req.body; // approve | reject | send_back
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (request.status !== 'submitted') {
    return res.status(400).json({ message: 'This request is not awaiting finance review.' });
  }
  request.financeAction = { by: req.user._id, at: new Date(), remarks };
  if (decision === 'approve') {
    request.status = 'finance_approved';
    await log(request, 'finance_approved', req.user, remarks);
  } else if (decision === 'reject') {
    request.status = 'rejected';
    await log(request, 'rejected', req.user, remarks);
  } else if (decision === 'send_back') {
    request.status = 'sent_back';
    await log(request, 'sent_back', req.user, remarks);
  } else {
    return res.status(400).json({ message: 'Decision must be approve, reject or send_back.' });
  }
  await request.save();
  res.json(request);
});

// POST /api/requests/:id/operations  — operations approval (operations or admin)
router.post('/:id/operations', allow('operations', 'admin'), async (req, res) => {
  const { decision, remarks } = req.body;
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (request.status !== 'finance_approved') {
    return res.status(400).json({ message: 'This request is not awaiting operations review.' });
  }
  request.operationsAction = { by: req.user._id, at: new Date(), remarks };
  if (decision === 'approve') {
    request.status = request.needsAdmin ? 'operations_approved' : 'approved';
    await log(request, 'operations_approved', req.user, remarks);
  } else if (decision === 'reject') {
    request.status = 'rejected';
    await log(request, 'rejected', req.user, remarks);
  } else if (decision === 'send_back') {
    request.status = 'sent_back';
    await log(request, 'sent_back', req.user, remarks);
  } else {
    return res.status(400).json({ message: 'Decision must be approve, reject or send_back.' });
  }
  await request.save();
  res.json(request);
});

// POST /api/requests/:id/admin  — final approval for above-threshold requests (admin only)
router.post('/:id/admin', allow('admin'), async (req, res) => {
  const { decision, remarks } = req.body;
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (request.status !== 'operations_approved') {
    return res.status(400).json({ message: 'This request is not awaiting admin approval.' });
  }
  request.adminAction = { by: req.user._id, at: new Date(), remarks };
  if (decision === 'approve') {
    request.status = 'approved';
    await log(request, 'admin_approved', req.user, remarks);
  } else if (decision === 'reject') {
    request.status = 'rejected';
    await log(request, 'rejected', req.user, remarks);
  } else if (decision === 'send_back') {
    request.status = 'sent_back';
    await log(request, 'sent_back', req.user, remarks);
  } else {
    return res.status(400).json({ message: 'Decision must be approve, reject or send_back.' });
  }
  await request.save();
  res.json(request);
});

// POST /api/requests/:id/pay  — record payment (finance, operations or admin)
router.post('/:id/pay', allow('finance', 'operations', 'admin'), async (req, res) => {
  const { date, mode, reference, proofUrl } = req.body;
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (request.status !== 'approved') {
    return res.status(400).json({ message: 'Only fully approved requests can be paid.' });
  }
  if (!mode || !reference) {
    return res.status(400).json({ message: 'Payment mode and reference (UTR/cheque no.) are required.' });
  }
  request.payment = { date: date || new Date(), mode, reference, proofUrl, by: req.user._id };
  request.status = 'paid';
  await request.save();
  await log(request, 'paid', req.user, `${mode} · ${reference}`);
  res.json(request);
});

// POST /api/requests/:id/close  — close after payment (finance, operations or admin)
router.post('/:id/close', allow('finance', 'operations', 'admin'), async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });
  if (request.status !== 'paid') {
    return res.status(400).json({ message: 'Only paid requests can be closed.' });
  }
  request.status = 'closed';
  await request.save();
  await log(request, 'closed', req.user, req.body.remarks);
  res.json(request);
});

module.exports = router;
