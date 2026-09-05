# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

JP-Learning is a Japanese listening-practice app. All code lives under `my-first-react-app/`: a Vite + React frontend and an Express backend in `backend/`. Code comments and error messages throughout are written in Vietnamese — match that convention when editing existing files.

## Commands

Run from `my-first-react-app/`:
- `npm run dev` — start the Vite dev server (frontend, port 5173)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, separate rules for `backend/**` vs `src/**`)
- `npm run preview` — preview the production build

Run from `my-first-react-app/backend/`:
- `npm start` — start the API server (port 3001, fixed)
- `npm run dev` — start with nodemon (auto-restart)

There is no test suite configured in this repo.

### First-time setup

Both halves need a `.env` copied from their `.env.example`:
- `my-first-react-app/.env` — `VITE_API_URL` (defaults to `http://localhost:3001/api`)
- `my-first-react-app/backend/.env` — `GEMINI_API_KEY` (required for question/translation/fill-blank generation; free key at aistudio.google.com/apikey)

The backend must be started before the frontend can fetch lessons/questions. CORS on the backend is hardcoded to allow only `http://localhost:5173`.

## Architecture

### Backend (`backend/server.js`)

Plain Express app, no router modules — all routes are defined directly in `server.js`. Three content sources, each with its own model:

1. **Static practice questions** — `GET /api/questions` reads `backend/data/questions.json` directly off disk on every request (no caching), keyed by type (`multipleChoice`, `fillBlank`, `shadowing`, etc.).
2. **YouTube lessons** (`lessons` table) — `POST /api/lessons` accepts a YouTube URL, extracts the video ID, fetches Japanese captions via `youtube-transcript`, normalizes timestamps (srv3 returns ms, classic returns seconds — detected by checking if max offset > 3600), tokenizes each segment for furigana via `furigana.js` (kuromoji), and translates all segments to Vietnamese in one Gemini call via `translate.js`. Segments are stored as a JSON blob in the `segments` column.
3. **Uploaded audio lessons** (`audio_lessons` table) — `POST /api/audio-lessons` accepts a multipart audio file (multer, 25MB cap, audio mimetype only) plus a user-supplied transcript, then calls Gemini (`generateQuestions.js`) to generate exam-style multiple-choice questions from that transcript.

Both `lessons` and `audio_lessons` support an on-demand, cached fill-in-the-blank endpoint (`POST /:id/fill`, via `generateFillBlanks.js`) — the generated questions are persisted to a `fill_questions` column and reused unless `?force=1` is passed.

**Database**: `database.js` wraps `sql.js` (WASM SQLite, not better-sqlite3) with a synchronous `all`/`get`/`run` API. The whole DB lives in memory and is serialized to `backend/data.db` on every write via `persist()` (`db.export()` then `fs.writeFileSync`) — there's no separate transaction/connection model. When adding columns to existing tables, follow the existing migration pattern: `CREATE TABLE IF NOT EXISTS` plus a best-effort `ALTER TABLE ADD COLUMN` wrapped in try/catch (ignore "column exists" errors) — see `init()` in `database.js`.

**Gemini integration**: All AI calls (`generateQuestions.js`, `generateFillBlanks.js`, `translate.js`) use `@google/genai` with `gemini-2.5-flash` and a strict `responseSchema` (typed via `Type.OBJECT`/`Type.ARRAY`) to force structured JSON output, plus post-parse validation that filters out malformed entries (e.g. fill-blank answers must literally occur as a substring of their `script`). Follow this schema + validate pattern for any new generation endpoint rather than trusting raw model output.

**Furigana**: `furigana.js` lazily builds a singleton kuromoji tokenizer (loads its dictionary once, async) and converts katakana readings to hiragana. Only kanji-containing tokens get a reading attached, and only when the reading differs from the surface form (avoids over-annotating kana-only words).

### Frontend (`src/`)

- Routing is centralized in `App.jsx` (react-router-dom `Routes`), all paths flat (no nested layouts). Each `/pages/*` component receives an `onBack` callback rather than navigating directly, and pages also stop any in-flight `window.speechSynthesis` before navigating away.
- `services/api.js` is the single fetch wrapper for all backend calls — it throws on non-OK responses using the server's `{ error }` body. Use this module (don't call `fetch` directly from components) when adding new endpoints.
- `services/progress.js` tracks quiz answer history and daily streaks entirely in `localStorage` (key `jlpt-n3-progress`) — there's no backend persistence for user progress/stats.
- `hooks/useQuestions.js` is the pattern for backend-data-loading hooks: tri-state (`null` = loading, `error`, or data), with a `retry`/`attempt` counter to force a refetch.
- TTS playback (`TTSPlayer.jsx`) uses the browser's native `window.speechSynthesis`, not a backend service.
