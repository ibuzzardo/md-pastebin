const { createPasteStore } = require('../store/pasteStore');

describe('pasteStore', () => {
  let store;

  beforeEach(() => {
    store = createPasteStore();
  });

  test('create persists paste with defaults and timestamps', () => {
    const paste = store.create({ id: 'p1', content: 'hello' });

    expect(paste).toMatchObject({
      id: 'p1',
      title: '',
      content: 'hello',
      views: 0
    });
    expect(Number.isNaN(Date.parse(paste.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(paste.updatedAt))).toBe(false);
  });

  test('returns defensive copies from create/getById', () => {
    const created = store.create({ id: 'p2', title: 't', content: 'c' });
    created.title = 'mutated';

    const fromStore = store.getById('p2');
    fromStore.content = 'mutated-content';

    const fromStoreAgain = store.getById('p2');
    expect(fromStoreAgain.title).toBe('t');
    expect(fromStoreAgain.content).toBe('c');
  });

  test('getById returns null for missing id', () => {
    expect(store.getById('missing')).toBeNull();
  });

  test('update returns null for missing paste', () => {
    expect(store.update('missing', { title: 'x', content: 'y' })).toBeNull();
  });

  test('update changes only provided string fields and refreshes updatedAt', async () => {
    const created = store.create({ id: 'p3', title: 'old', content: 'old-content' });

    const updated = store.update('p3', { content: 'new-content' });

    expect(updated.title).toBe('old');
    expect(updated.content).toBe('new-content');
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt));
  });

  test('incrementViews increments views and returns null for missing id', () => {
    store.create({ id: 'p4', content: 'v' });

    const first = store.incrementViews('p4');
    const second = store.incrementViews('p4');

    expect(first.views).toBe(1);
    expect(second.views).toBe(2);
    expect(store.incrementViews('missing')).toBeNull();
  });

  test('remove returns true once and false for missing', () => {
    store.create({ id: 'p5', content: 'x' });

    expect(store.remove('p5')).toBe(true);
    expect(store.remove('p5')).toBe(false);
  });

  test('list returns summaries without content', () => {
    store.create({ id: 'p6', title: 'one', content: 'secret' });

    const list = store.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'p6', title: 'one', views: 0 });
    expect(list[0]).not.toHaveProperty('content');
  });
});
