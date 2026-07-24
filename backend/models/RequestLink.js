const mongoose = require('mongoose');
const crypto = require('crypto');

// A one-time, no-login link that lets an outside person raise a payment
// request on behalf of the account holder who generated it.
const requestLinkSchema = new mongoose.Schema(
  {
    token: { type: String, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: String, // denormalised so approvers see who issued the link
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: Date,
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' } // set once submitted
  },
  { timestamps: true }
);

requestLinkSchema.statics.newToken = () => crypto.randomBytes(24).toString('hex');

// A link is usable only while unused and unexpired.
requestLinkSchema.virtual('isActive').get(function () {
  return !this.used && this.expiresAt > new Date();
});

module.exports = mongoose.model('RequestLink', requestLinkSchema);
