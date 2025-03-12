const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const LocationHistory = require('../models/LocationHistory');
const Location = require('../models/Location');
const Shipment = require('../models/Shipment');

// Endpoint: POST /api/update-location-history
router.post('/api/update-location-history', async (req, res) => {
  const { packingCode, batchCode, oldLocation, newLocation, transferDate } = req.body;
  if (!packingCode || !batchCode || !oldLocation || !newLocation || !transferDate) {
    return res.status(400).send({ message: 'PackingCode, BatchCode, OldLocation, NewLocation, and TransferDate are required' });
  }
  try {
    const locationHistory = new LocationHistory({ packingCode, batchCode, oldLocation, newLocation, transferDate });
    await locationHistory.save();
    await Product.findOneAndUpdate({ packingCode, batchCode }, { location: newLocation, transferDate }, { new: true });
    res.status(200).send({ message: 'Location history updated and product location changed successfully' });
  } catch (error) {
    console.error('Error updating location history:', error);
    res.status(500).send({ message: 'Error updating location history' });
  }
});

// Endpoint: POST /api/add-new-location
router.post('/api/add-new-location', async (req, res) => {
  const { locationName } = req.body;
  if (!locationName) {
    return res.status(400).send({ message: 'Location name is required' });
  }
  try {
    const newLocation = new Location({ _id: locationName, type: 'new', sub_locations: [] });
    await newLocation.save();
    res.status(200).send({ message: 'New location added successfully' });
  } catch (error) {
    console.error('Error adding new location:', error);
    res.status(500).send({ message: 'Error adding new location' });
  }
});

// Endpoint: POST /api/add-product
router.post('/api/add-product', async (req, res) => {
  const { packingCode, batchCode, quantity, productionDate, date, productType, location, confirmedBy } = req.body;
  const existingProduct = await Product.findOne({ packingCode, batchCode });
  if (existingProduct) {
    return res.status(400).send({ message: 'This combination of Packing Code and Batch Code already exists!' });
  }
  if (!packingCode || !batchCode || !quantity || !productionDate || !date || !productType || !location || !confirmedBy) {
    return res.status(400).send({ message: 'All fields are required' });
  }
  try {
    const newProduct = new Product({ packingCode, batchCode, quantity, productionDate, date, productType, location, confirmedBy });
    await newProduct.save();
    const [locationId, sublocationName] = location.split('-');
    const locationData = await Location.findById(locationId);
    if (locationData) {
      const subLocation = locationData.sub_locations.find(sub => sub.name === sublocationName);
      if (subLocation) {
        subLocation.occupied += 1;
        subLocation.capacity -= 1;
        await locationData.save();
      }
    }
    res.status(200).send({ message: 'Product successfully added and location updated' });
  } catch (error) {
    console.error('Error saving product and updating location:', error);
    res.status(500).send({ message: 'Error saving product and updating location' });
  }
});

// Endpoint: POST /api/add-products
router.post('/api/add-products', async (req, res) => {
  const { products, location, username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  if (!products || !Array.isArray(products) || products.length === 0 || !location) {
    return res.status(400).send({ message: 'Invalid input. Please provide products and location.' });
  }
  try {
    let insertedCount = 0;
    for (const product of products) {
      if (!product.confirmedBy) {
        return res.status(400).json({ message: 'Each product must have confirmedBy (username).' });
      }
      const { packingCode, batchCode, quantity, productionDate, date, productType, confirmedBy } = product;
      const existingProduct = await Product.findOne({ packingCode, batchCode });
      if (existingProduct) {
        console.log(`Skipping existing product with Packing Code: ${packingCode} and Batch Code: ${batchCode}`);
        continue;
      }
      const newProduct = new Product({ packingCode, batchCode, quantity, productionDate, date, productType, location, confirmedBy: username });
      await newProduct.save();
      insertedCount++;
    }
    const [locationId, sublocationName] = location.split('-');
    const locationData = await Location.findById(locationId);
    if (locationData) {
      const subLocation = locationData.sub_locations.find(sub => sub.name === sublocationName);
      if (subLocation) {
        subLocation.occupied += insertedCount;
        subLocation.capacity -= insertedCount;
        await locationData.save();
      }
    }
    res.status(200).send({ insertedCount, message: 'Products successfully added and location updated' });
  } catch (error) {
    console.error('Error adding products:', error);
    res.status(500).send({ message: 'Error adding products and updating location' });
  }
});

// Endpoint: POST /api/transfer-product
router.post('/api/transfer-product', async (req, res) => {
  const { transferDate, productType, newLocation, pallets, transferedBy } = req.body;
  if (!transferDate || !productType || !newLocation || !pallets || pallets.length === 0 || !transferedBy) {
    return res.status(400).send({ message: 'All fields are required' });
  }
  try {
    for (const pallet of pallets) {
      const { packingCode, batchCode, quantity, productionDate } = pallet;
      const product = await Product.findOne({ packingCode, batchCode });
      if (!product) {
        return res.status(404).send({ message: `Product with packing code ${packingCode} and batch code ${batchCode} not found` });
      }
      const previousLocation = product.newLocation || product.location;
      console.log(`Product ${packingCode}-${batchCode} previous location:`, previousLocation);

      await Product.findOneAndUpdate({ packingCode, batchCode }, { transferDate, newLocation, location: previousLocation, transferedBy }, { new: true });

      const [newLocationId, newSublocationName] = newLocation.split('-');
//COBA
// console.log("New location value received:", newLocation);
//       const newLocArr = newLocation.split('-');
//       if (newLocArr.length < 2) {
//         console.error("Invalid newLocation format. Expected 'locationId-sublocationName'");
//         return res.status(400).send({ message: "Invalid newLocation format" });
//       }
//       const [newLocationId, ...subNameParts] = newLocArr;
//       const newSublocationName = subNameParts.join('-'); // Jika nama sublokasi mengandung dash
//       console.log(`Parsed newLocationId: ${newLocationId}, newSublocationName: ${newSublocationName}`);
//
      const newLocationData = await Location.findById(newLocationId);
      if (newLocationData) {
        const subLocation = newLocationData.sub_locations.find(sub => sub.name === newSublocationName);
        if (subLocation) {
          console.log("Before update, subLocation:", subLocation);
          subLocation.occupied += 1;
          subLocation.capacity -= 1;
          console.log("After update, subLocation:", subLocation);
          await newLocationData.save();
        } else {
          console.warn(`Sub-location ${newSublocationName} not found in location ${newLocationId}`);
        }
      } else {
        console.warn(`New location with id ${newLocationId} not found`);
      }
    }
    res.status(200).send({ message: 'Products successfully transferred and locations updated' });
  } catch (error) {
    console.error('Error transferring products:', error);
    res.status(500).send({ message: 'Error transferring products' });
  }
});

// Endpoint: GET /api/products
router.get('/api/products', async (req, res) => {
  try {
    const { packingCode, batchCode } = req.query;
    const query = {};
    if (packingCode) query.packingCode = packingCode;
    if (batchCode) query.batchCode = batchCode;
    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send({ message: `Error fetching products: ${error.message}` });
  }
});

// Endpoint: POST /api/update-location-capacity
router.post('/api/update-location-capacity', async (req, res) => {
  const { location, change } = req.body;
  if (!location || typeof change !== 'number') {
    return res.status(400).send({ message: 'Location and change value are required' });
  }
  try {
    const [locationId, sublocationName] = location.split('-');
    const locationData = await Location.findById(locationId);
    if (!locationData) {
      return res.status(404).send({ message: 'Location not found' });
    }
    const subLocation = locationData.sub_locations.find(sub => sub.name === sublocationName);
    if (!subLocation) {
      return res.status(404).send({ message: `Sub-location ${sublocationName} not found` });
    }
    subLocation.occupied += change;
    subLocation.capacity -= change;
    if (subLocation.capacity < 0) {
      return res.status(400).send({ message: 'Not enough capacity to remove product' });
    }
    await locationData.save();
    res.status(200).send({ message: 'Location capacity updated successfully' });
  } catch (error) {
    console.error('Error updating location capacity:', error);
    res.status(500).send({ message: 'Error updating location capacity' });
  }
});

// Endpoint: DELETE /api/delete-product
router.delete('/api/delete-product', async (req, res) => {
  const { packingCode, batchCode } = req.query;
  if (!packingCode || !batchCode) {
    return res.status(400).send({ message: 'Packing Code and Batch Code are required' });
  }
  try {
    const product = await Product.findOneAndDelete({ packingCode, batchCode });
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }
    const [locationId, sublocationName] = product.location.split('-');
    const locationData = await Location.findById(locationId);
    if (locationData) {
      const subLocation = locationData.sub_locations.find(sub => sub.name === sublocationName);
      if (subLocation) {
        subLocation.occupied -= 1;
        subLocation.capacity += 1;
        await locationData.save();
      }
    }
    res.status(200).send({ message: 'Product successfully deleted and location updated' });
  } catch (error) {
    console.error('Error deleting product and updating location:', error);
    res.status(500).send({ message: 'Error deleting product and updating location' });
  }
});

// Endpoint: GET /search-packing-code
router.get('/search-packing-code', async (req, res) => {
  const query = req.query.q || '';
  try {
    const pallets = await Product.find({ packingCode: { $regex: query, $options: 'i' } }).limit(10);
    res.json(pallets);
  } catch (error) {
    console.error('Error searching for packing code:', error);
    res.status(500).send({ message: 'Error searching for packing code' });
  }
});



// Endpoint: GET /api/locations/all
router.get('/api/locations/all', async (req, res) => {
  try {
    const locations = await Location.find();
    res.status(200).json(locations);
  } catch (error) {
    console.error('Error fetching all locations:', error);
    res.status(500).send({ message: 'Error fetching all locations' });
  }
});

// Endpoint: GET /api/locations
router.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find();
    const availableLocations = locations.map(location => {
      const availableSubLocations = location.sub_locations.filter(sub => sub.capacity > 0);
      if (availableSubLocations.length > 0) {
        return {
          _id: location._id,
          type: location.type,
          sub_locations: availableSubLocations
        };
      }
      return null;
    }).filter(location => location !== null);
    res.status(200).json(availableLocations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).send({ message: 'Error fetching locations' });
  }
});

// Endpoint: POST /api/check-combination
router.post('/api/check-combination', async (req, res) => {
  const { packingCode, batchCode } = req.body;
  if (!packingCode || !batchCode) {
    return res.status(400).send({ exists: false });
  }
  try {
    const product = await Product.findOne({ packingCode, batchCode });
    res.status(200).send({ exists: !!product });
  } catch (error) {
    console.error('Error checking combination:', error);
    res.status(500).send({ exists: false });
  }
});

// Endpoint: POST /api/shipment-confirm
router.post('/api/shipment-confirm', async (req, res) => {
  const { shipmentDate, noSi, shipmentBy, pallets } = req.body;
  if (!shipmentDate || !noSi || !shipmentBy || !pallets || pallets.length === 0) {
    return res.status(400).send({ message: 'All fields are required' });
  }
  try {
    for (const pallet of pallets) {
      const { packingCode, batchCode } = pallet;
      const product = await Product.findOne({ packingCode, batchCode });
      if (!product) {
        return res.status(404).send({ message: `Product with packing code ${packingCode} and batch code ${batchCode} not found` });
      }
      await Product.findOneAndUpdate({ packingCode, batchCode }, { shipmentDate, noSi }, { new: true });
    }
    const newShipment = new Shipment({ shipmentDate, noSi, shipmentBy, pallets });
    await newShipment.save();
    res.status(200).send({ message: 'Shipment confirmed and products updated successfully' });
  } catch (error) {
    console.error('Error during shipment confirmation:', error);
    res.status(500).send({ message: 'Error during shipment confirmation' });
  }
});

// Endpoint: POST /api/shipments
router.post('/api/shipments', async (req, res) => {
  const { shipmentDate, noSi, shipmentBy, pallets } = req.body;
  if (!shipmentDate || !noSi || !shipmentBy || !pallets || pallets.length === 0) {
    return res.status(400).send({ message: 'All fields are required' });
  }
  try {
    const newShipment = new Shipment({ shipmentDate, noSi, shipmentBy, pallets });
    await newShipment.save();
    res.status(200).send({ message: 'Shipment data saved successfully' });
  } catch (error) {
    console.error('Error saving shipment:', error);
    res.status(500).send({ message: 'Error saving shipment data' });
  }
});

// Endpoint: POST /api/check-shipped
router.post('/api/check-shipped', async (req, res) => {
  const { packingCode, batchCode } = req.body;
  if (!packingCode || !batchCode) {
    return res.status(400).send({ exists: false });
  }
  try {
    const product = await Product.findOne({ packingCode, batchCode });
    const isShipped = product && product.shipmentDate && product.noSi;
    res.status(200).send({ exists: isShipped });
  } catch (error) {
    console.error('Error checking shipment status:', error);
    res.status(500).send({ exists: false });
  }
});

// Endpoint: GET /api/shipments
router.get('/api/shipments', async (req, res) => {
  try {
    const shipments = await Shipment.find();
    const shipmentData = shipments.map(shipment => ({
      shipmentDate: shipment.shipmentDate,
      noSi: shipment.noSi,
      pallets: shipment.pallets.map(pallet => ({
        packingCode: pallet.packingCode,
        batchCode: pallet.batchCode,
        quantity: pallet.quantity,
        productionDate: pallet.productionDate,
        shipmentDate: pallet.shipmentDate
      }))
    }));
    res.status(200).json(shipmentData);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).send({ message: 'Error fetching shipments' });
  }
});

module.exports = router;
