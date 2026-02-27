/**
 * @jest-environment jsdom
 */

const { createApp } = require('../app');

function mountDom() {
  document.body.innerHTML = `
    <input id="titleInput" />
    <textarea id="contentInput"></textarea>
    <article id="preview"></article>
    <button id="createButton"></button>
    <button id="updateButton"></button>
    <button id="deleteButton"></button>
    <button id="copyLinkButton"></button>
    <p id="statusMessage"></p>
    <p id="errorMessage"></p>
    <p id="metadata"></p>
    <p id="sizeCounter"></p>
  `;
}

describe('app CRUD flow', () => {
  beforeEach(() => {
    mountDom();
    window.location.hash = '';
  });

  test('create flow stores id and updates metadata/hash', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: 'abc123', title: '', content: 'x', views: 0 } })
    }));

    const renderMock = jest.fn();
    const app = createApp({ fetchImpl: fetchMock, renderMarkdown: renderMock });

    app.elements.contentInput.value = 'x';
    await app.createPaste();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pastes',
      expect.objectContaining({ method: 'POST' })
    );
    expect(app.state.currentPasteId).toBe('abc123');
    expect(app.state.currentViews).toBe(0);
    expect(app.elements.metadata.textContent).toContain('ID: abc123');
    expect(window.location.hash).toBe('#abc123');
  });

  test('load flow populates fields and metadata', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 'id1', title: 't', content: 'c', views: 7 } })
    }));

    const renderMock = jest.fn();
    const app = createApp({ fetchImpl: fetchMock, renderMarkdown: renderMock });

    await app.loadPaste('id1');

    expect(fetchMock).toHaveBeenCalledWith('/api/pastes/id1', expect.anything());
    expect(app.state.currentPasteId).toBe('id1');
    expect(app.state.currentViews).toBe(7);
    expect(app.elements.titleInput.value).toBe('t');
    expect(app.elements.contentInput.value).toBe('c');
    expect(app.elements.metadata.textContent).toContain('Views: 7');
    expect(renderMock).toHaveBeenCalled();
  });

  test('delete flow clears state and metadata', async () => {
    const fetchMock = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'DELETE') {
        return { ok: true, status: 204 };
      }
      return {
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'id2', title: '', content: 'x', views: 0 } })
      };
    });

    const app = createApp({ fetchImpl: fetchMock, renderMarkdown: () => {} });

    app.elements.contentInput.value = 'x';
    await app.createPaste();
    await app.deletePaste();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pastes/id2',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(app.state.currentPasteId).toBe(null);
    expect(app.state.currentViews).toBe(0);
    expect(app.elements.metadata.textContent).toBe('');
  });

  test('create flow surfaces API error payload message/details', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Validation failed', details: { content: 'Content is required' } } })
    }));

    const app = createApp({ fetchImpl: fetchMock, renderMarkdown: () => {} });

    app.elements.contentInput.value = '';
    await app.createPaste();

    expect(app.elements.errorMessage.textContent).toMatch(/Validation failed|Content is required/);
  });

  test('load flow handles not found without mutating current paste', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Paste not found' } })
    }));

    const app = createApp({ fetchImpl: fetchMock, renderMarkdown: () => {} });
    app.state.currentPasteId = 'existing';

    await app.loadPaste('missing');

    expect(app.state.currentPasteId).toBe('existing');
    expect(app.elements.errorMessage.textContent).toContain('Paste not found');
  });
});
