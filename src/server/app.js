const express = require('express');
const path = require('path');
const { createPastesRouter } = require('./routes/pastes');
const { createHealthRouter } = require('./routes/health');
const { createPasteStore } = require('./store/pasteStore');

function createApp(options = {}) {
  const app = express();
  const store = options.store || createPasteStore();

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.use('/api/health', createHealthRouter());
  app.use('/api/pastes', createPastesRouter({ store }));

  const publicDir = path.join(__dirname, '../../public');
  app.use(express.static(publicDir));

  app.use('/api', (req, res) => {
    res.status(404).json({
      error: {
        message: 'API route not found'
      }
    });
  });

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({
        error: {
          message: 'Request body exceeds 100KB limit'
        }
      });
    }

    if (err && err.status) {
      return res.status(err.status).json({
        error: {
          message: err.message || 'Request failed',
          details: err.details || null
        }
      });
    }

    const message = (err && err.message) || 'Internal Server Error';
    return res.status(500).json({
      error: {
        message
      }
    });
  });

  return app;
}

module.exports = { createApp };
