// BrainBridge API server (Express).
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errors');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Render and other hosts put the app behind a proxy (needed for correct https detection)

// CORS (API only): allow same-origin requests, the React dev server, and the deployed frontend URL(s).
const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
const corsForApi = cors((req, cb) => {
  const origin = req.get('Origin');
  const sameOrigin = origin && origin === `${req.protocol}://${req.get('host')}`;
  if (!origin || sameOrigin || allowed.includes(origin) || allowed.includes('*')) return cb(null, { origin: true });
  const err = new Error(`CORS: origin ${origin} is not allowed. Add it to CLIENT_URL in .env.`);
  err.status = 403;
  return cb(err);
});
app.use(express.json({ limit: '1mb' }));

app.use('/api', corsForApi, routes);
app.use('/api', (req, res) => res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` }));

// Single-service deployment option: if the React app has been built, serve it from the same server.
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BrainBridge API running on http://localhost:${PORT}/api`);
  });
}

module.exports = app;
