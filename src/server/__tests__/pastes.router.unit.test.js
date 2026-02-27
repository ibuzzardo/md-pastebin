const express = require('express');
const request = require('supertest');
const { createPastesRouter } = require('../routes/pastes');

function buildApp({ store, idGenerator = () => 'fixed-id' }) {
  const app = express();
  app.use(express.json());
  app.use('/api/pastes', createPastesRouter({ store, idGenerator }));
  return app;
}

describe('pastes router unit', () => {
  test('GET / returns list from store', async () => {
    const store = { list: jest.fn(() => [{ id: '1', title: '', views: 0 }]) };
    const app = buildApp({ store });

    const res = await request(app).get('/api/pastes').expect(200);
    expect(store.list).toHaveBeenCalledTimes(1);
    expect(res.body.data).toEqual([{ id: '1', title: '', views: 0 }]);
  });

  test('POST / validates payload and uses id generator', async () => {
    const store = {
      list: jest.fn(),
      create: jest.fn((data) => ({ ...data, createdAt: 'c', updatedAt: 'u', views: 0 }))
    };
    const idGenerator = jest.fn(() => 'abc123');
    const app = buildApp({ store, idGenerator });

    const res = await request(app)
      .post('/api/pastes')
      .send({ title: 'T', content: 'Body' })
      .expect(201);

    expect(idGenerator).toHaveBeenCalledTimes(1);
    expect(store.create).toHaveBeenCalledWith({ id: 'abc123', title: 'T', content: 'Body' });
    expect(res.body.data.id).toBe('abc123');
  });

  test('POST / returns 400 validation envelope on invalid payload', async () => {
    const store = { list: jest.fn(), create: jest.fn() };
    const app = buildApp({ store });

    const res = await request(app).post('/api/pastes').send({ title: 'Only title' }).expect(400);
    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details.content).toBeDefined();
    expect(store.create).not.toHaveBeenCalled();
  });

  test('GET /:id increments views and returns 404 if not found', async () => {
    const store = {
      list: jest.fn(),
      create: jest.fn(),
      incrementViews: jest
        .fn()
        .mockReturnValueOnce({ id: 'x', title: '', content: 'c', views: 1 })
        .mockReturnValueOnce(null)
    };
    const app = buildApp({ store });

    const ok = await request(app).get('/api/pastes/x').expect(200);
    expect(ok.body.data.views).toBe(1);

    const notFound = await request(app).get('/api/pastes/missing').expect(404);
    expect(notFound.body.error.message).toBe('Paste not found');
  });

  test('PUT /:id handles not found, validation failure, and success', async () => {
    const store = {
      list: jest.fn(),
      create: jest.fn(),
      incrementViews: jest.fn(),
      remove: jest.fn(),
      getById: jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ id: 'a', title: '', content: 'old' })
        .mockReturnValueOnce({ id: 'a', title: '', content: 'old' }),
      update: jest.fn(() => ({ id: 'a', title: 'n', content: 'new' }))
    };
    const app = buildApp({ store });

    await request(app).put('/api/pastes/a').send({ content: 'new' }).expect(404);

    const invalid = await request(app).put('/api/pastes/a').send({ title: 'x' }).expect(400);
    expect(invalid.body.error.message).toBe('Validation failed');

    const ok = await request(app)
      .put('/api/pastes/a')
      .send({ title: 'n', content: 'new' })
      .expect(200);

    expect(store.update).toHaveBeenCalledWith('a', { title: 'n', content: 'new' });
    expect(ok.body.data.content).toBe('new');
  });

  test('DELETE /:id returns 204 on success and 404 otherwise', async () => {
    const store = {
      list: jest.fn(),
      create: jest.fn(),
      incrementViews: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true)
    };
    const app = buildApp({ store });

    const notFound = await request(app).delete('/api/pastes/x').expect(404);
    expect(notFound.body.error.message).toBe('Paste not found');

    await request(app).delete('/api/pastes/x').expect(204);
  });
});
