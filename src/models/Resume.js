const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  filename:    { type: String, required: true },
  fileSize:    { type: Number },
  mimeType:    { type: String },
  emailedTo:   { type: String },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);