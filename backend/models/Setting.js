const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed
});

// Helper: get value with default
settingSchema.statics.get = async function (key, fallback) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : fallback;
};

settingSchema.statics.set = async function (key, value) {
  return this.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

module.exports = mongoose.model('Setting', settingSchema);
