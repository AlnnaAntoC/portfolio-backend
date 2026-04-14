const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
  process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:3000' : null,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blocked origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: false,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.path}`, req.body, 'origin=', req.headers.origin);
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