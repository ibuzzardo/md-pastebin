const express = require('express');
const { nanoid } = require('nanoid');
const { validatePastePayload } = require('../validation/pasteValidation');

function createPastesRouter({ store, idGenerator = nanoid }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ data: store.list() });
  });

  router.post('/', (req, res) => {
    const validation = validatePastePayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: validation.errors
        }
      });
    }

    const paste = store.create({
      id: idGenerator(),
      title: req.body.title || '',
      content: req.body.content
    });

    return res.status(201).json({ data: paste });
  });

  router.get('/:id', (req, res) => {
    const paste = store.incrementViews(req.params.id);
    if (!paste) {
      return res.status(404).json({
        error: {
          message: 'Paste not found'
        }
      });
    }

    return res.json({ data: paste });
  });

  router.put('/:id', (req, res) => {
    const existing = store.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        error: {
          message: 'Paste not found'
        }
      });
    }

    const validation = validatePastePayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: validation.errors
        }
      });
    }

    const updated = store.update(req.params.id, {
      title: req.body.title || '',
      content: req.body.content
    });

    return res.json({ data: updated });
  });

  router.delete('/:id', (req, res) => {
    const removed = store.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({
        error: {
          message: 'Paste not found'
        }
      });
    }

    return res.status(204).send();
  });

  return router;
}

module.exports = { createPastesRouter };
