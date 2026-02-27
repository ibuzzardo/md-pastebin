const MAX_CONTENT_BYTES = 100 * 1024;
const MAX_TITLE_LENGTH = 200;

function utf8ByteLength(value) {
  return Buffer.byteLength(value || '', 'utf8');
}

function validatePastePayload(payload) {
  const errors = {};

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: {
        body: 'Request body must be a JSON object'
      }
    };
  }

  if (typeof payload.content !== 'string' || payload.content.trim().length === 0) {
    errors.content = 'Content is required';
  } else if (utf8ByteLength(payload.content) > MAX_CONTENT_BYTES) {
    errors.content = 'Content exceeds 100KB limit';
  }

  if (payload.title !== undefined) {
    if (typeof payload.title !== 'string') {
      errors.title = 'Title must be a string';
    } else if (payload.title.length > MAX_TITLE_LENGTH) {
      errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or fewer`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  MAX_CONTENT_BYTES,
  MAX_TITLE_LENGTH,
  utf8ByteLength,
  validatePastePayload
};
