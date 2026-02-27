const request = require('supertest');
const { createApp } = require('../app');
const { createPasteStore } = require('../store/pasteStore');

describe('pastes API', () => {
  let app;

  beforeEach(() => {
    app = createApp({ store: createPasteStore() });
  });

  test('creates a paste with generated id', async () => {
    const response = await request(app)
      .post('/api/pastes')
      .send({ title: 'Hello', content: '# Hi' })
      .expect(201);

    expect(response.body.data.id).toMatch(/^[A-Za-z0-9_-]{10,}$/);
    expect(response.body.data.views).toBe(0);
  });

  test('increments views on each read', async () => {
    const create = await request(app)
      .post('/api/pastes')
      .send({ content: 'abc' })
      .expect(201);

    const id = create.body.data.id;

    const firstGet = await request(app).get(`/api/pastes/${id}`).expect(200);
    const secondGet = await request(app).get(`/api/pastes/${id}`).expect(200);

    expect(firstGet.body.data.views).toBe(1);
    expect(secondGet.body.data.views).toBe(2);
  });

  test('updates and deletes paste', async () => {
    const create = await request(app)
      .post('/api/pastes')
      .send({ content: 'old' })
      .expect(201);

    const id = create.body.data.id;

    const updated = await request(app)
      .put(`/api/pastes/${id}`)
      .send({ title: 'new', content: 'new-content' })
      .expect(200);

    expect(updated.body.data.title).toBe('new');
    expect(updated.body.data.content).toBe('new-content');

    await request(app).delete(`/api/pastes/${id}`).expect(204);
    await request(app).get(`/api/pastes/${id}`).expect(404);
  });

  test('returns validation errors', async () => {
    const response = await request(app)
      .post('/api/pastes')
      .send({ title: 'x' })
      .expect(400);

    expect(response.body.error.details.content).toBeDefined();
  });

  test('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown').expect(404);
    expect(response.body.error.message).toBe('API route not found');
  });
});
