require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dbConnect = require('./config/db');

// Load environment variables
// dotenv.config();

dbConnect();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(morgan('dev'));

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/api');

app.use('/', authRoutes); 
app.use('/', apiRoutes);  

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// app.get('/', (req, res) => {
//   res.send('Welcome to the Warehouse API');
// });

module.exports = app;

