const app = require('../backend/app');

module.exports = (req, res) => {
  // Prefix '/api' so Express routes mounted at '/api/*' match on Vercel
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
};
