const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  _id: String,
  type: String,
  sub_locations: [
    {
      name: String,
      capacity: Number,
      occupied: Number,
    },
  ],
});

module.exports = mongoose.model('Location', locationSchema, 'locations');
