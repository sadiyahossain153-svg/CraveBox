const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

// Route Imports
const foodRoutes = require('./routes/foodRoutes');
const groupRoutes = require('./routes/groupRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(express.json());
app.use(cors());

// Connect Database
connectDB();

// API Endpoints
app.use('/api/foods', foodRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/orders', orderRoutes);

// Direct Route to Main Root index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});