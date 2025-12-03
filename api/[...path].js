const app = require('../backend/app');

module.exports = (req, res) => {
  // For wildcard routes under /api/*, ensure Express sees '/api/...'
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
};
