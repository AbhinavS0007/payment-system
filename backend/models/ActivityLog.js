const mongoose = require('mongoose');

// Immutable audit trail - no updates or deletes ever
const logSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
    requestCode: String,
    action: { type: String, required: true }, // created, submitted, finance_approved, operations_approved, admin_approved, rejected, sent_back, paid, closed, edited
    remarks: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    byName: String,
    byRole: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('ActivityLog', logSchema);
