(function initAppModule(globalObject) {
  const MAX_CONTENT_BYTES = 100 * 1024;

  function getDefaultRenderer() {
    if (globalObject.MarkdownRenderer && typeof globalObject.MarkdownRenderer.renderMarkdown === 'function') {
      return globalObject.MarkdownRenderer.renderMarkdown;
    }
    return function fallbackRender(markdown, previewEl) {
      if (previewEl) {
        previewEl.textContent = markdown;
      }
      return markdown;
    };
  }

  function utf8ByteLength(value) {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(value || '').length;
    }
    return unescape(encodeURIComponent(value || '')).length;
  }

  function createApp(options = {}) {
    const documentObj = options.documentObj || globalObject.document;
    const windowObj = options.windowObj || globalObject;
    const fetchImpl = options.fetchImpl || globalObject.fetch;
    const renderMarkdown = options.renderMarkdown || getDefaultRenderer();

    const elements = {
      titleInput: documentObj.getElementById('titleInput'),
      contentInput: documentObj.getElementById('contentInput'),
      preview: documentObj.getElementById('preview'),
      createButton: documentObj.getElementById('createButton'),
      updateButton: documentObj.getElementById('updateButton'),
      deleteButton: documentObj.getElementById('deleteButton'),
      copyLinkButton: documentObj.getElementById('copyLinkButton'),
      statusMessage: documentObj.getElementById('statusMessage'),
      errorMessage: documentObj.getElementById('errorMessage'),
      metadata: documentObj.getElementById('metadata'),
      sizeCounter: documentObj.getElementById('sizeCounter')
    };

    const state = {
      currentPasteId: null,
      currentViews: 0
    };

    function setStatus(message, type) {
      elements.statusMessage.textContent = message || '';
      elements.statusMessage.className = type || '';
    }

    function setError(message) {
      elements.errorMessage.textContent = message || '';
    }

    function setMetadata() {
      if (!state.currentPasteId) {
        elements.metadata.textContent = '';
        return;
      }
      elements.metadata.textContent = `ID: ${state.currentPasteId} | Views: ${state.currentViews}`;
    }

    function updateActionState() {
      const hasPaste = Boolean(state.currentPasteId);
      elements.updateButton.disabled = !hasPaste;
      elements.deleteButton.disabled = !hasPaste;
      elements.copyLinkButton.disabled = !hasPaste;
    }

    function updateSizeCounter() {
      const bytes = utf8ByteLength(elements.contentInput.value);
      elements.sizeCounter.textContent = `${bytes} / ${MAX_CONTENT_BYTES} bytes`;
      return bytes;
    }

    function readForm() {
      return {
        title: elements.titleInput.value.trim(),
        content: elements.contentInput.value
      };
    }

    function writeForm(paste) {
      elements.titleInput.value = paste.title || '';
      elements.contentInput.value = paste.content || '';
      renderPreview();
      updateSizeCounter();
    }

    function setPasteInUrl(id) {
      if (!id) {
        windowObj.location.hash = '';
        return;
      }
      windowObj.location.hash = `#${id}`;
    }

    function getPasteFromUrl() {
      const hash = windowObj.location.hash || '';
      return hash.startsWith('#') ? hash.slice(1) : '';
    }

    function validateContentSize() {
      const size = updateSizeCounter();
      if (size > MAX_CONTENT_BYTES) {
        setError('Content exceeds 100KB limit');
        return false;
      }
      return true;
    }

    function renderPreview() {
      const markdown = elements.contentInput.value;
      renderMarkdown(markdown, elements.preview);
    }

    async function requestJson(url, config) {
      const response = await fetchImpl(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        ...config
      });

      if (response.status === 204) {
        return null;
      }

      const payload = await response.json();
      if (!response.ok) {
        const errorMessage = payload && payload.error && payload.error.message ? payload.error.message : 'Request failed';
        throw new Error(errorMessage);
      }

      return payload;
    }

    async function loadPaste(id) {
      setError('');
      setStatus('Loading...', '');

      const result = await requestJson(`/api/pastes/${id}`, {
        method: 'GET'
      });

      const paste = result.data;
      state.currentPasteId = paste.id;
      state.currentViews = paste.views;
      writeForm(paste);
      setMetadata();
      updateActionState();
      setStatus('Paste loaded', 'success');
    }

    async function createPaste() {
      setError('');
      if (!validateContentSize()) {
        return;
      }

      const data = readForm();
      setStatus('Creating...', '');

      const result = await requestJson('/api/pastes', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      const paste = result.data;
      state.currentPasteId = paste.id;
      state.currentViews = paste.views;
      setPasteInUrl(paste.id);
      setMetadata();
      updateActionState();
      setStatus('Paste created', 'success');
    }

    async function updatePaste() {
      if (!state.currentPasteId) {
        return;
      }
      setError('');
      if (!validateContentSize()) {
        return;
      }

      setStatus('Updating...', '');
      const data = readForm();
      const result = await requestJson(`/api/pastes/${state.currentPasteId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      state.currentViews = result.data.views;
      setMetadata();
      setStatus('Paste updated', 'success');
    }

    async function deletePaste() {
      if (!state.currentPasteId) {
        return;
      }

      setError('');
      setStatus('Deleting...', '');
      await requestJson(`/api/pastes/${state.currentPasteId}`, {
        method: 'DELETE'
      });

      state.currentPasteId = null;
      state.currentViews = 0;
      elements.titleInput.value = '';
      elements.contentInput.value = '';
      renderPreview();
      updateSizeCounter();
      setPasteInUrl('');
      setMetadata();
      updateActionState();
      setStatus('Paste deleted', 'success');
    }

    async function initFromUrl() {
      const id = getPasteFromUrl();
      if (!id) {
        renderPreview();
        updateSizeCounter();
        updateActionState();
        return;
      }

      try {
        await loadPaste(id);
      } catch (error) {
        setError(error.message);
        setStatus('', '');
      }
    }

    function bindEvents() {
      elements.contentInput.addEventListener('input', () => {
        renderPreview();
        if (validateContentSize()) {
          setError('');
        }
      });

      elements.createButton.addEventListener('click', async () => {
        try {
          await createPaste();
        } catch (error) {
          setError(error.message);
          setStatus('', '');
        }
      });

      elements.updateButton.addEventListener('click', async () => {
        try {
          await updatePaste();
        } catch (error) {
          setError(error.message);
          setStatus('', '');
        }
      });

      elements.deleteButton.addEventListener('click', async () => {
        try {
          await deletePaste();
        } catch (error) {
          setError(error.message);
          setStatus('', '');
        }
      });

      elements.copyLinkButton.addEventListener('click', async () => {
        if (!state.currentPasteId || !windowObj.navigator || !windowObj.navigator.clipboard) {
          return;
        }

        const link = `${windowObj.location.origin}/#${state.currentPasteId}`;
        await windowObj.navigator.clipboard.writeText(link);
        setStatus('Link copied', 'success');
      });
    }

    function init() {
      bindEvents();
      initFromUrl();
    }

    return {
      init,
      renderPreview,
      createPaste,
      updatePaste,
      deletePaste,
      loadPaste,
      state,
      elements,
      validateContentSize,
      updateSizeCounter
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createApp,
      utf8ByteLength,
      MAX_CONTENT_BYTES
    };
  }

  globalObject.MDPastebinApp = { createApp, utf8ByteLength, MAX_CONTENT_BYTES };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const app = createApp();
      app.init();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
