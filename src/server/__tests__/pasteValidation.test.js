const {
  MAX_CONTENT_BYTES,
  MAX_TITLE_LENGTH,
  utf8ByteLength,
  validatePastePayload
} = require('../validation/pasteValidation');

describe('pasteValidation', () => {
  test('utf8ByteLength handles ascii and multibyte', () => {
    expect(utf8ByteLength('abc')).toBe(3);
    expect(utf8ByteLength('😀')).toBe(4);
    expect(utf8ByteLength('')).toBe(0);
    expect(utf8ByteLength()).toBe(0);
  });

  test('rejects non-object payload', () => {
    const result = validatePastePayload(null);
    expect(result.isValid).toBe(false);
    expect(result.errors.body).toBe('Request body must be a JSON object');
  });

  test('rejects missing and blank content', () => {
    expect(validatePastePayload({}).errors.content).toBe('Content is required');
    expect(validatePastePayload({ content: '   ' }).errors.content).toBe('Content is required');
  });

  test('accepts content exactly at byte limit', () => {
    const content = 'a'.repeat(MAX_CONTENT_BYTES);
    const result = validatePastePayload({ content });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test('rejects content over byte limit (multibyte aware)', () => {
    const emoji = '😀';
    const allowedCount = Math.floor(MAX_CONTENT_BYTES / 4);
    const overLimit = emoji.repeat(allowedCount + 1);

    const result = validatePastePayload({ content: overLimit });
    expect(result.isValid).toBe(false);
    expect(result.errors.content).toBe('Content exceeds 100KB limit');
  });

  test('validates optional title type and length', () => {
    const nonString = validatePastePayload({ content: 'ok', title: 123 });
    expect(nonString.isValid).toBe(false);
    expect(nonString.errors.title).toBe('Title must be a string');

    const tooLong = validatePastePayload({
      content: 'ok',
      title: 'x'.repeat(MAX_TITLE_LENGTH + 1)
    });
    expect(tooLong.isValid).toBe(false);
    expect(tooLong.errors.title).toBe(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  });

  test('accepts valid payload with title', () => {
    const result = validatePastePayload({ content: '# hello', title: 'Hi' });
    expect(result).toEqual({ isValid: true, errors: {} });
  });
});
