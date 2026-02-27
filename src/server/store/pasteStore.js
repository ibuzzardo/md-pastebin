function clonePaste(paste) {
  return { ...paste };
}

function createPasteStore() {
  const pastes = new Map();

  return {
    create(data) {
      const now = new Date().toISOString();
      const paste = {
        id: data.id,
        title: data.title || '',
        content: data.content,
        createdAt: now,
        updatedAt: now,
        views: 0
      };
      pastes.set(paste.id, paste);
      return clonePaste(paste);
    },

    getById(id) {
      const paste = pastes.get(id);
      return paste ? clonePaste(paste) : null;
    },

    update(id, data) {
      const existing = pastes.get(id);
      if (!existing) {
        return null;
      }

      const updated = {
        ...existing,
        title: typeof data.title === 'string' ? data.title : existing.title,
        content: typeof data.content === 'string' ? data.content : existing.content,
        updatedAt: new Date().toISOString()
      };

      pastes.set(id, updated);
      return clonePaste(updated);
    },

    remove(id) {
      return pastes.delete(id);
    },

    incrementViews(id) {
      const existing = pastes.get(id);
      if (!existing) {
        return null;
      }
      existing.views += 1;
      existing.updatedAt = existing.updatedAt || new Date().toISOString();
      pastes.set(id, existing);
      return clonePaste(existing);
    },

    list() {
      return Array.from(pastes.values()).map((paste) => ({
        id: paste.id,
        title: paste.title,
        createdAt: paste.createdAt,
        updatedAt: paste.updatedAt,
        views: paste.views
      }));
    }
  };
}

module.exports = { createPasteStore };
