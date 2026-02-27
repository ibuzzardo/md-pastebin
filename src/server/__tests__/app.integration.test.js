const request = require('supertest');
const { createApp } = require('../app');
const { createPasteStore } = require('../store/pasteStore');

describe('createApp integration', () => {
  test('serves health endpoint with ISO timestamp', async () => {
    const app = createApp({ store: createPasteStore() });
    const res = await request(app).get('/api/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  test('returns API 404 envelope for unknown /api routes', async () => {
    const app = createApp({ store: createPasteStore() });
    const res = await request(app).get('/api/not-real').expect(404);

    expect(res.body).toEqual({
      error: { message: 'API route not found' }
    });
  });

  test('serves index.html for non-api unknown routes', async () => {
    const app = createApp({ store: createPasteStore() });
    const res = await request(app).get('/some/client/route').expect(200);

    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>Markdown Pastebin</title>');
  });

  test('returns 413 on parser-level oversized JSON body', async () => {
    const app = createApp({ store: createPasteStore() });
    const huge = 'a'.repeat(150 * 1024);

    const res = await request(app)
      .post('/api/pastes')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ content: huge }))
      .expect(413);

    expect(res.body.error.message).toBe('Request body exceeds 100KB limit');
  });

  test('returns status+details for body-parser syntax errors', async () => {
    const app = createApp({ store: createPasteStore() });

    const res = await request(app)
      .post('/api/pastes')
      .set('Content-Type', 'application/json')
      .send('{"content": "abc"')
      .expect(400);

    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('details');
  });
});
