const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  endpoint: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'error'],
    default: 'offline'
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  responseTime: {
    type: Number,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Server', serverSchema);
