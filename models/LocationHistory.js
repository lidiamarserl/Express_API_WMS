const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  packingCode: String,
  batchCode: String,
  oldLocation: String,
  newLocation: String,
  transferDate: String,
  transferedBy: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LocationHistory', locationHistorySchema, 'locationHistory');
