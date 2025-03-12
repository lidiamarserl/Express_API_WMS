// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// const mongoUri = process.env.MONGO_URI ||  'mongodb+srv://WMSGHCI:GH123@wmsghci.mlyez.mongodb.net/warehouse-ghci?retryWrites=true&w=majority&appName=WMSGHCI'; 

// const dbConnect  = async () => {
//     try {
//         await mongoose.connect(mongoUri, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log("MongoDB connection SUCCESS (warehouse-ghci)");
//     } catch (error) {
//         console.error(`MongoDB Connection Error: ${error.message}`);
//         process.exit(1);
//     }
//     };

// export default dbConnect;

const mongoose = require('mongoose');

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://WMSGHCI:GH123@wmsghci.mlyez.mongodb.net/warehouse-ghci?retryWrites=true&w=majority&appName=WMSGHCI', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = dbConnect;
