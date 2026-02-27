describe('server index bootstrap', () => {
  const originalEnvPort = process.env.PORT;

  afterEach(() => {
    jest.resetModules();
    process.env.PORT = originalEnvPort;
    jest.restoreAllMocks();
  });

  test('startServer uses default port 3000 when PORT is unset', () => {
    delete process.env.PORT;

    const listenMock = jest.fn((port, cb) => {
      cb();
      return { close: jest.fn() };
    });
    const appMock = { listen: listenMock };

    jest.isolateModules(() => {
      jest.doMock('../app', () => ({ createApp: jest.fn(() => appMock) }));
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const { startServer } = require('../index');
      const result = startServer();

      expect(result.app).toBe(appMock);
      expect(listenMock).toHaveBeenCalledWith(3000, expect.any(Function));
      expect(logSpy).toHaveBeenCalledWith('md-pastebin listening on http://localhost:3000');
    });
  });

  test('startServer uses numeric PORT from env', () => {
    process.env.PORT = '4567';

    const listenMock = jest.fn((port, cb) => {
      cb();
      return { close: jest.fn() };
    });
    const appMock = { listen: listenMock };

    jest.isolateModules(() => {
      jest.doMock('../app', () => ({ createApp: jest.fn(() => appMock) }));
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const { startServer } = require('../index');
      startServer();

      expect(listenMock).toHaveBeenCalledWith(4567, expect.any(Function));
    });
  });
});
