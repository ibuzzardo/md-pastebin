const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;

function startServer() {
  const app = createApp();
  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`md-pastebin listening on http://localhost:${PORT}`);
  });
  return { app, server };
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
