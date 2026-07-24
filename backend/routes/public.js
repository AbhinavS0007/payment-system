const router = require('express').Router();
const RequestLink = require('../models/RequestLink');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const Setting = require('../models/Setting');
const Category = require('../models/Category');
const Project = require('../models/Project');
const validateLists = require('../utils/validateLists');

// NOTE: these routes are intentionally unauthenticated — reached via an
// unguessable one-time token only. No `protect` middleware here.

const findActive = async (token) => {
  const link = await RequestLink.findOne({ token });
  if (!link) return { error: 404, message: 'This link is invalid.' };
  if (link.used) return { error: 410, message: 'This link has already been used.' };
  if (link.expiresAt <= new Date()) return { error: 410, message: 'This link has expired. Please ask for a new one.' };
  return { link };
};

// GET /api/public/request-form/:token  — validate the link, reveal the issuer, and
// return the managed project/category lists to populate the dropdowns
router.get('/request-form/:token', async (req, res) => {
  const { link, error, message } = await findActive(req.params.token);
  if (error) return res.status(error).json({ message });
  const [categories, projects] = await Promise.all([
    Category.find().sort({ name: 1 }).select('name'),
    Project.find().sort({ name: 1 }).select('name')
  ]);
  res.json({
    valid: true,
    generatedByName: link.createdByName,
    categories: categories.map((c) => c.name),
    projects: projects.map((p) => p.name)
  });
});

// POST /api/public/request-form/:token  — submit a payment request on behalf of the issuer
router.post('/request-form/:token', async (req, res) => {
  const { link, error, message } = await findActive(req.params.token);
  if (error) return res.status(error).json({ message });

  const {
    payeeName, payeeDetails, payeeQrUrl, amount, category, project, urgency, description, attachmentUrl, billPhotoUrl,
    submittedByName, submittedByContact
  } = req.body;

  if (!submittedByName) {
    return res.status(400).json({ message: 'Please enter your name.' });
  }
  if (!payeeName || !amount || !category || !project) {
    return res.status(400).json({ message: 'Payee, amount, category and project are required.' });
  }
  const listError = await validateLists(category, project);
  if (listError) return res.status(400).json({ message: listError });

  const threshold = await Setting.get('directorThreshold', 50000);
  const request = await Request.create({
    payeeName, payeeDetails, payeeQrUrl, amount, category, project, urgency, description, attachmentUrl, billPhotoUrl,
    requester: link.createdBy,
    viaLink: true,
    submittedByName,
    submittedByContact,
    needsAdmin: Number(amount) > threshold,
    status: 'submitted'
  });

  // Audit trail — logged under the issuer, but names the outside submitter.
  await ActivityLog.create({
    request: request._id,
    requestCode: request.code,
    action: 'submitted',
    remarks: `Submitted by ${submittedByName}${submittedByContact ? ` (${submittedByContact})` : ''} via shared link`,
    by: link.createdBy,
    byName: `${submittedByName} (shared link)`,
    byRole: 'external'
  });

  link.used = true;
  link.usedAt = new Date();
  link.request = request._id;
  await link.save();

  res.status(201).json({ code: request.code });
});

module.exports = router;
