# TaskZen

An ADHD productivity tool built with Angular 20, NgRx, and Firebase — helping you capture tasks, track energy, build routines, and stay focused.

## Features

- **Item capture** — quick inbox for thoughts; move items through Inbox / In Progress / Done
- **Prioritize** — reorder and triage items by urgency and importance
- **Focus timer** — Pomodoro-style SVG ring timer with break tracking and calm mode
- **Energy logging** — log your energy level throughout the day; spot patterns over time
- **Routine builder** — build step-by-step routines and play through them with a guided flow
- **AI Coach** — rule-based nudges and suggestions based on your task and energy state
- **Insights dashboard** — energy trend chart, priority distribution, and streak tracking
- **PWA** — installable, works offline; Angular service worker caches assets and state

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Angular 20.3.x — standalone components, signals, zoneless change detection |
| State | NgRx Store + Effects (feature slices for every domain) |
| Persistence | In-memory (default) + Firebase Firestore (opt-in) |
| Auth | Firebase Authentication (opt-in) |
| SSR server | Express 5 + `@angular/ssr` (`src/server.ts`) |
| PWA | Angular service worker + `manifest.webmanifest` |
| Linting | `@angular-eslint` + ESLint flat config |
| Error tracking | Sentry (optional, configured via `SENTRY_DSN`) |
| Testing | Karma/Jasmine (unit) + Playwright (E2E) |

## Prerequisites

- Node.js 20+
- A Firebase project with Firestore and Authentication enabled (optional — the app runs fully offline without it)

## Setup

```bash
git clone https://github.com/<your-org>/taskzen.git
cd taskzen
npm install
cp .env.example .env   # then edit .env with your values
```

## Firebase Configuration

Firebase is opt-in. To enable it, create `src/app/firebase.config.local.ts` (this file is gitignored) with your Firebase Web App credentials:

```ts
import { FirebaseEnvConfig } from './firebase.config';

export const firebaseEnv: FirebaseEnvConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  appId: 'your-app-id',
  storageBucket: 'your-project.appspot.com',    // optional
  messagingSenderId: '123456789',               // optional
  measurementId: 'G-XXXXXXXXXX',               // optional
};
```

If the file is absent (e.g., in CI), the app falls back to in-memory storage with no Firebase dependency.

## Development

```bash
npm start
```

Opens at <http://localhost:4200> with live reload.

To run the Express SSR server locally:

```bash
npm run build
node dist/TaskZen/server/server.mjs
```

Opens at <http://localhost:4000>.

## Testing

Run unit tests with coverage (Karma + Jasmine):

```bash
npm test
```

The CI pipeline enforces a 60% coverage gate. The project currently ships 136 unit tests.

Run Playwright E2E tests (3 journeys):

```bash
npm run e2e
```

## Linting

```bash
npm run lint
```

Uses `@angular-eslint` with an ESLint flat config (`eslint.config.mjs`).

## Building

Production build:

```bash
npm run build
```

Artifacts are output to `dist/TaskZen`. Initial bundle budget: warning at 800 kB, error at 1.5 MB.

## Environment Variables

These variables are read by the Express SSR server (`src/server.ts`). Copy `.env.example` to `.env` and set values before running the server.

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | Port the Express SSR server listens on |
| `ALLOWED_ORIGIN` | `http://localhost:4200` | CORS allowed origin (restrict to your domain in production) |
| `NODE_ENV` | `development` | Runtime environment: `development`, `production`, or `test` |
| `SENTRY_DSN` | _(empty)_ | Sentry DSN for error tracking; omit or leave blank to disable |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Lint** — `npm run lint`
2. **Audit** — `npm audit --audit-level=high`
3. **Unit tests** — `npm test` with 60% coverage gate
4. **Build** — `npm run build`
5. **E2E** — Playwright tests against the production build
6. **Firebase preview** — deploys a preview channel on pull requests (requires `FIREBASE_TOKEN` secret)
