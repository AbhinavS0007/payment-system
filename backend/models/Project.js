const mongoose = require('mongoose');

// Managed list of projects / sites. Only operations & admin can change it.
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
