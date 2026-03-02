# md-pastebin

> Built with [Dark Factory v4](https://github.com/ibuzzardo/dark-factory-v4) — autonomous AI software development pipeline

Markdown Pastebin — anonymous paste service with live preview.

## Features

- Anonymous paste CRUD with `nanoid` identifiers
- Live markdown preview as you type
- Syntax highlighting for fenced code blocks
- View counter per paste
- 100KB content limit with frontend + backend enforcement
- Shareable URLs via hash routing (`/#<id>`)
- Copy link button for easy sharing

## Tech Stack

- Express.js backend with in-memory store
- Vanilla JS SPA frontend
- Marked + highlight.js for markdown rendering
- Supertest + JSDOM for testing

## Getting Started

```bash
git clone https://github.com/ibuzzardo/md-pastebin.git
cd md-pastebin
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/health | Service health check |
| GET | /api/pastes | List paste summaries |
| POST | /api/pastes | Create a new paste |
| GET | /api/pastes/:id | Get paste (increments views) |
| PUT | /api/pastes/:id | Update paste content/title |
| DELETE | /api/pastes/:id | Delete paste |

## Architecture

- `src/server/` — Express app, API routes, validation, in-memory store
- `public/` — static SPA UI (index.html, app.js, markdown.js, styles.css)
- `src/server/__tests__/` — API and limit tests (Supertest)
- `public/__tests__/` — frontend behaviour and markdown preview tests (JSDOM)

## Pipeline Stats

- **Sprint cost:** ~$1.20
- **Coder passes:** 1

## License

MIT — see [LICENSE](LICENSE)
