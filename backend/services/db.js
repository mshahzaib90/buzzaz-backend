const { Pool } = require('pg');

// Use DATABASE_URL env var. Enable SSL in production/serverless if provided.
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10)
});

// Add error handler to prevent crash on idle client errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit process, just log it. The pool will discard the client.
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};

