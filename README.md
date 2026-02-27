# md-pastebin

Markdown Pastebin — anonymous paste service with live preview.

## Overview

This project is a full-stack Markdown Pastebin:
- Express backend serving API + static frontend
- Anonymous paste CRUD with `nanoid` identifiers
- Live markdown preview in browser
- Syntax highlighting for fenced code blocks
- View count increments on successful paste reads
- Hard 100KB content limit (UTF-8 byte length)

## Architecture

- `src/server/`: Express app, API routes, validation, in-memory store
- `public/`: static SPA UI (`index.html`, `app.js`, `markdown.js`, `styles.css`)
- `src/server/__tests__/`: API and limit tests (Supertest)
- `public/__tests__/`: frontend behavior and markdown preview tests (JSDOM)

## API Contract

Base path: `/api`

- `GET /api/health`
  - Returns service health and timestamp
- `GET /api/pastes`
  - Lists paste summaries
- `POST /api/pastes`
  - Body: `{ "title"?: string, "content": string }`
  - Creates paste, returns full record
- `GET /api/pastes/:id`
  - Returns paste and increments `views`
- `PUT /api/pastes/:id`
  - Body: `{ "title"?: string, "content": string }`
  - Updates paste content/title
- `DELETE /api/pastes/:id`
  - Deletes paste

### Paste Shape

```json
{
  "id": "nanoid",
  "title": "optional",
  "content": "markdown",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "views": 0
}
```

## 100KB Limit Semantics

- Server parser limit: request body capped at 100KB (`413` on overflow)
- Validation limit: `content` must be `<= 102400` UTF-8 bytes (`400` with details)
- Frontend live size counter warns and blocks submit above limit

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
npm run test:server
npm run test:client
```

## UX Notes

- Editor and preview update live as you type
- URL hash stores active paste ID (`/#<id>`) for easy sharing
- Copy Link button copies current paste link
- Metadata shows current paste ID + views
