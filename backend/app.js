const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Initialize Postgres client
const pg = require('./services/db');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "data:", "blob:"],
      frameSrc: ["'self'", "https:"],
    },
  },
}));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.disable('x-powered-by');

// Allow ALL origins for development to rule out CORS issues
app.use(cors());

// Previous specific configuration commented out for debugging
// if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_ORIGIN) {
//   app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
// } else {
//   app.use(cors({
//     origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
//   }));
// }
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static (local dev and Railway). Avoid '/uploads' on serverless if ephemeral.
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/influencer', require('./routes/influencer'));
app.use('/api/influencers', require('./routes/influencers'));
app.use('/api/admin', require('./routes/admin'));
// Firebase-backed routes are disabled for Postgres-only operation
app.use('/api/ugc', require('./routes/ugc'));
app.use('/api/email', require('./routes/email'));
app.use('/api/chat', require('./routes/chat'));

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

let buildPath = null;
const shouldServeFrontend = process.env.SERVE_FRONTEND === 'true' || (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND !== 'false');
console.log(`Serve Frontend: ${shouldServeFrontend} (Env: ${process.env.NODE_ENV})`);

if (shouldServeFrontend) {
  buildPath = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(buildPath));
}
// Datastore health (development diagnostics)
app.get('/api/health/datastore', async (req, res) => {
  try {
    const result = await pg.query('SELECT NOW() as now');
    res.json({ status: 'OK', now: result.rows[0]?.now, db: 'postgres' });
  } catch (error) {
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ status: 'ERROR', message: 'Postgres not reachable', error: dev ? String(error?.message || error) : undefined });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

if (shouldServeFrontend) {
  app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

module.exports = app;
