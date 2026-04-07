const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');   // ← ADDED

dotenv.config();
connectDB();                                // ← ADDED

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.path}`, req.body);
  next();
});

// Routes
const contactRoute = require('./routes/contact');
app.use('/api/contact', contactRoute);

const careersRoute = require('./routes/careers');
app.use('/api/careers', careersRoute);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});