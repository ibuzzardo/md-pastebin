(function initMarkdownModule(globalObject) {
  const markedLib = globalObject.marked || safeRequire('marked');
  const hljsLib = globalObject.hljs || safeRequire('highlight.js');

  function safeRequire(name) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(name);
    } catch (err) {
      return null;
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeHtml(html) {
    const withoutScripts = String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const withoutEventHandlers = withoutScripts.replace(/\son[a-z]+\s*=\s*(['\"]).*?\1/gi, '');
    return withoutEventHandlers.replace(/(href|src)\s*=\s*(['\"])\s*javascript:[^'\"]*\2/gi, '$1="#"');
  }

  function parseMarkdown(markdownText) {
    const markdown = String(markdownText || '');

    if (markedLib && typeof markedLib.parse === 'function') {
      if (typeof markedLib.setOptions === 'function') {
        markedLib.setOptions({
          gfm: true,
          breaks: true
        });
      }
      return markedLib.parse(markdown);
    }

    return `<pre><code>${escapeHtml(markdown)}</code></pre>`;
  }

  function highlightAllCodeBlocks(root) {
    if (!root || !hljsLib || typeof hljsLib.highlightElement !== 'function') {
      return;
    }

    const blocks = root.querySelectorAll('pre code');
    blocks.forEach((block) => hljsLib.highlightElement(block));
  }

  function renderMarkdown(markdownText, previewElement) {
    const parsed = parseMarkdown(markdownText);
    const safeHtml = sanitizeHtml(parsed);

    if (previewElement) {
      previewElement.innerHTML = safeHtml;
      highlightAllCodeBlocks(previewElement);
    }

    return safeHtml;
  }

  const api = {
    renderMarkdown,
    sanitizeHtml,
    highlightAllCodeBlocks
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalObject.MarkdownRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
