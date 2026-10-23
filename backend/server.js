const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const { ensureDemoData } = require('./utils/demoData');
const { NETWORK } = require('./services/blockchainSimulator');

// Route imports
const authRoutes = require('./routes/auth');
const loanRoutes = require('./routes/loan');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();

// Render (and most hosts) sit behind a proxy; needed for correct client IPs in rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS: CORS_ORIGIN / FRONTEND_URL may be "*" or a comma-separated list of origins
const allowedOrigins = [process.env.FRONTEND_URL, process.env.CORS_ORIGIN]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.length === 0 || allowedOrigins.includes('*');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Body parser middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint (used by Render) - registered before the rate limiter
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'DeFiCorp API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    blockchain: NETWORK
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DeFiCorp API',
    health: '/api/health'
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loan', loanRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 400 && err.type === 'entity.parse.failed'
      ? 'Invalid JSON in request body'
      : err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5050;

const start = async () => {
  await connectDB();

  if (process.env.SEED_DEMO_DATA !== 'false') {
    try {
      await ensureDemoData();
    } catch (error) {
      console.error('Demo data seeding failed:', error.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 DeFiCorp API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Allowed origins: ${allowAllOrigins ? '*' : allowedOrigins.join(', ')}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = app;
