const router = require('express').Router();
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const { protect, allow } = require('../middleware/auth');

router.use(protect);

// GET /api/dashboard/summary  — stats for admin dashboard
router.get('/summary', allow('finance', 'director'), async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [statusCounts, monthSpend, byCategory, byProject, monthly] = await Promise.all([
    Request.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    Request.aggregate([
      { $match: { status: { $in: ['paid', 'closed'] }, 'payment.date': { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Request.aggregate([
      { $match: { status: { $in: ['paid', 'closed'] } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]),
    Request.aggregate([
      { $match: { status: { $in: ['paid', 'closed'] } } },
      { $group: { _id: '$project', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 8 }
    ]),
    Request.aggregate([
      { $match: { status: { $in: ['paid', 'closed'] }, 'payment.date': { $exists: true } } },
      { $group: {
          _id: { y: { $year: '$payment.date' }, m: { $month: '$payment.date' } },
          total: { $sum: '$amount' }
        } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      { $limit: 12 }
    ])
  ]);

  res.json({ statusCounts, monthSpend: monthSpend[0] || { total: 0, count: 0 }, byCategory, byProject, monthly });
});

// GET /api/dashboard/logs  — recent audit trail
router.get('/logs', allow('finance', 'director'), async (req, res) => {
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

// GET /api/dashboard/export  — CSV of all requests
router.get('/export', allow('finance', 'director'), async (req, res) => {
  const requests = await Request.find().populate('requester', 'name').sort({ createdAt: -1 });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Code', 'Date', 'Requester', 'Payee', 'Amount', 'Category', 'Project', 'Urgency', 'Status', 'Payment Date', 'Mode', 'Reference'].join(',')
  ];
  requests.forEach((r) =>
    rows.push([
      esc(r.code), esc(r.createdAt.toISOString().slice(0, 10)), esc(r.requester?.name),
      esc(r.payeeName), r.amount, esc(r.category), esc(r.project), esc(r.urgency), esc(r.status),
      esc(r.payment?.date ? r.payment.date.toISOString().slice(0, 10) : ''),
      esc(r.payment?.mode), esc(r.payment?.reference)
    ].join(','))
  );
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=blueisle-payments.csv');
  res.send(rows.join('\n'));
});

module.exports = router;
