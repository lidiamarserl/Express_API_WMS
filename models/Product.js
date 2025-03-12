const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  packingCode: String,
  batchCode: String,
  quantity: String,
  productionDate: String,
  date: String,
  productType: String,
  location: String,
  confirmedBy: String,
  transferDate: String,
  newLocation: String,
  transferedBy: String,
  shipmentDate: String,
  noSi: String,
  shipmentBy: String,
});

module.exports = mongoose.model('Product', productSchema, 'products');
