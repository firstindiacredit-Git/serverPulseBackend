const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  lockerPin: {
    type: String,
    required: true,
    default: '0786'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
