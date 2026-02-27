const request = require('supertest');
const { createApp } = require('../app');
const { createPasteStore } = require('../store/pasteStore');
const { MAX_CONTENT_BYTES } = require('../validation/pasteValidation');

describe('size limits', () => {
  let app;

  beforeEach(() => {
    app = createApp({ store: createPasteStore() });
  });

  test('accepts content at exactly 100KB', async () => {
    const content = 'a'.repeat(MAX_CONTENT_BYTES);
    await request(app)
      .post('/api/pastes')
      .send({ content })
      .expect(201);
  });

  test('rejects content over 100KB via validation', async () => {
    const content = 'a'.repeat(MAX_CONTENT_BYTES + 1);
    const response = await request(app)
      .post('/api/pastes')
      .send({ content })
      .expect(400);

    expect(response.body.error.details.content).toMatch(/100KB/);
  });

  test('rejects oversized request body at parser level', async () => {
    const huge = 'a'.repeat(150 * 1024);

    const response = await request(app)
      .post('/api/pastes')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ content: huge }))
      .expect(413);

    expect(response.body.error.message).toMatch(/100KB/);
  });
});
