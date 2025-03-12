const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentDate: String,
  noSi: String,
  shipmentBy: String,
  pallets: [
    {
      packingCode: String,
      batchCode: String,
      quantity: String,
      productionDate: String,
      shipmentDate: String
    }
  ]
});

module.exports = mongoose.model('Shipment', shipmentSchema, 'shipments');
