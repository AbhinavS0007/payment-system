const mongoose = require('mongoose');

// Managed list of payment categories. Only operations & admin can change it.
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
