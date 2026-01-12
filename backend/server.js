const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to 0.0.0.0 for container/Railway support

try {
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });

  // Surface listener errors (e.g., EADDRINUSE, EACCES)
  server.on('error', (err) => {
    console.error('Failed to start server:', err.code || err.message, err);
  });
} catch (err) {
  console.error('Unexpected server startup error:', err);
}

module.exports = app;