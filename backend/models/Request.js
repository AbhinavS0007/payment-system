const mongoose = require('mongoose');

const STATUSES = [
  'draft',
  'submitted',              // awaiting finance
  'finance_approved',       // awaiting operations
  'operations_approved',    // awaiting admin (only if above threshold)
  'approved',               // fully approved, awaiting payment
  'sent_back',              // returned to employee for edits
  'rejected',
  'paid',
  'closed'
];

const requestSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true }, // BI-PAY-2026-001
    payeeName: { type: String, required: true, trim: true },
    payeeDetails: { type: String, trim: true }, // UPI / bank account
    amount: { type: Number, required: true, min: 1 },
    category: {
      type: String,
      enum: ['Site Material', 'Labour', 'Subcontractor', 'Office', 'Marketing', 'Travel', 'Misc'],
      required: true
    },
    project: { type: String, required: true, trim: true },
    urgency: { type: String, enum: ['Normal', 'Urgent'], default: 'Normal' },
    description: { type: String, trim: true },
    attachmentUrl: String, // Cloudinary / Drive link to invoice or quotation

    status: { type: String, enum: STATUSES, default: 'draft' },
    needsAdmin: { type: Boolean, default: false },

    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Set when the request was raised through a shared public link.
    viaLink: { type: Boolean, default: false },
    submittedByName: { type: String, trim: true },    // the outside person who filled the form
    submittedByContact: { type: String, trim: true }, // their phone / email (optional)

    financeAction: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: Date,
      remarks: String
    },
    operationsAction: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: Date,
      remarks: String
    },
    adminAction: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: Date,
      remarks: String
    },

    payment: {
      date: Date,
      mode: { type: String, enum: ['UPI', 'NEFT', 'IMPS', 'Cash', 'Cheque'] },
      reference: String, // UTR / cheque number
      proofUrl: String,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },
  { timestamps: true }
);

// Auto-generate request code: BI-PAY-<year>-<seq>
requestSchema.pre('save', async function (next) {
  if (this.code) return next();
  const year = new Date().getFullYear();
  const prefix = `BI-PAY-${year}-`;
  const last = await this.constructor
    .findOne({ code: new RegExp(`^${prefix}`) })
    .sort({ code: -1 })
    .select('code');
  const seq = last ? parseInt(last.code.split('-').pop(), 10) + 1 : 1;
  this.code = `${prefix}${String(seq).padStart(3, '0')}`;
  next();
});

module.exports = mongoose.model('Request', requestSchema);
module.exports.STATUSES = STATUSES;
