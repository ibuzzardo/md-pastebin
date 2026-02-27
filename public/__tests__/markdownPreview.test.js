/**
 * @jest-environment jsdom
 */

describe('markdown preview module', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock('marked');
    jest.dontMock('highlight.js');
  });

  test('renderMarkdown writes HTML into preview and returns HTML', () => {
    jest.isolateModules(() => {
      const { renderMarkdown } = require('../markdown');
      const preview = document.createElement('div');

      const output = renderMarkdown('# Hello', preview);

      expect(typeof output).toBe('string');
      expect(preview.innerHTML).toBe(output);
      expect(preview.innerHTML.length).toBeGreaterThan(0);
    });
  });

  test('sanitizeHtml strips scripts, inline handlers, and javascript: urls', () => {
    jest.isolateModules(() => {
      const { sanitizeHtml } = require('../markdown');
      const dirty =
        '<p onclick="evil()">safe</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>';

      const clean = sanitizeHtml(dirty);

      expect(clean).toContain('<p>safe</p>');
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('onclick=');
      expect(clean).toContain('href="#"');
    });
  });

  test('highlightAllCodeBlocks calls highlight.js for each block', () => {
    const highlightElement = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('highlight.js', () => ({ highlightElement }));
      const { highlightAllCodeBlocks } = require('../markdown');
      const preview = document.createElement('div');
      preview.innerHTML = '<pre><code>a</code></pre><pre><code>b</code></pre>';

      highlightAllCodeBlocks(preview);

      expect(highlightElement).toHaveBeenCalledTimes(2);
    });
  });

  test('falls back to escaped pre/code when marked.parse is unavailable', () => {
    jest.isolateModules(() => {
      jest.doMock('marked', () => ({}));
      const { renderMarkdown } = require('../markdown');
      const preview = document.createElement('div');

      renderMarkdown('<script>x</script>', preview);

      expect(preview.innerHTML).toContain('<pre><code>');
      expect(preview.innerHTML).toContain('&lt;script&gt;x&lt;/script&gt;');
    });
  });
});
