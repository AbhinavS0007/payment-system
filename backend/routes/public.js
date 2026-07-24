const router = require('express').Router();
const RequestLink = require('../models/RequestLink');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const Setting = require('../models/Setting');

// NOTE: these routes are intentionally unauthenticated — reached via an
// unguessable one-time token only. No `protect` middleware here.

const findActive = async (token) => {
  const link = await RequestLink.findOne({ token });
  if (!link) return { error: 404, message: 'This link is invalid.' };
  if (link.used) return { error: 410, message: 'This link has already been used.' };
  if (link.expiresAt <= new Date()) return { error: 410, message: 'This link has expired. Please ask for a new one.' };
  return { link };
};

// GET /api/public/request-form/:token  — validate the link and reveal who issued it
router.get('/request-form/:token', async (req, res) => {
  const { link, error, message } = await findActive(req.params.token);
  if (error) return res.status(error).json({ message });
  res.json({ valid: true, generatedByName: link.createdByName });
});

// POST /api/public/request-form/:token  — submit a payment request on behalf of the issuer
router.post('/request-form/:token', async (req, res) => {
  const { link, error, message } = await findActive(req.params.token);
  if (error) return res.status(error).json({ message });

  const {
    payeeName, payeeDetails, amount, category, project, urgency, description, attachmentUrl,
    submittedByName, submittedByContact
  } = req.body;

  if (!submittedByName) {
    return res.status(400).json({ message: 'Please enter your name.' });
  }
  if (!payeeName || !amount || !category || !project) {
    return res.status(400).json({ message: 'Payee, amount, category and project are required.' });
  }

  const threshold = await Setting.get('directorThreshold', 50000);
  const request = await Request.create({
    payeeName, payeeDetails, amount, category, project, urgency, description, attachmentUrl,
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
