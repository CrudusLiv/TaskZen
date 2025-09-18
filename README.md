# TaskZen

Modern, signal‑driven productivity & kanban workspace built with Angular 20, Firebase, and NgRx.

## Firestore Composite Index (Cards Ordering)

To enable ordered card streaming (by column + position) a composite index is defined in `firestore.indexes.json`:

- collectionGroup: `cards`
- fields: `boardId` ASC, `columnId` ASC, `position` ASC

Deploy with Firebase CLI (or let GitHub Actions deploy, if configured). Without it the app may fallback to unsorted listeners depending on your effects configuration.

## ✨ Features

- Kanban board with boards / columns / cards (lazy loaded routes)
- Focus mode & task list
- Analytics dashboard (Chart.js via ngx-chartjs)
- Real‑time persistence (Firestore) with offline IndexedDB cache
- Authentication (email/password + placeholder for Google provider)
- Notifications & activity feed
- Toast & dialog UI services
- Theming (accent color, dark mode baseline)
- Server entry prepared for SSR / Express integration
- Strict Angular 20 + Standalone Components + Signals + Zoneless change detection
- NgRx Store + Effects + Entity (scoped feature reducers & effects)

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Angular 20 (standalone, signals, zoneless) |
| State | NgRx Store / Effects / Entity + Signals in components |
| Backend (Realtime & Auth) | Firebase (Auth, Firestore) |
| Charts | Chart.js 4 + ngx-chartjs |
| Server Harness | Express 5 + `@angular/ssr` (server entry `src/server.ts`) |

## 📁 Key Structure

```
src/
	app/
		auth/              # Auth UI + NgRx auth feature
		boards/            # Boards dashboard + effects
		kanban/            # Board / column / card domain + firestore sync effects
		tasks/             # Task feature state & UI
		focus/             # Focus mode feature
		analytics/         # Analytics dashboard (Chart.js)
		notifications/     # Activity feed & bell
		navigation/        # Side navigation component
		ui/                # Reusable UI primitives (toast, dialog)
		theme/             # Theme service (accent management)
		store/             # Root app state wiring
		app.routes.ts      # Lazy feature route definitions
		app.config.ts      # Global providers (router, firebase, zoneless, store)
		app.ts             # Root component (signals, breadcrumbs)
server.ts              # Express + Angular SSR request handler
main.ts                # Browser bootstrap
main.server.ts         # Exports server bootstrap (SSR build)
```

## 🔧 Prerequisites

- Node.js 20+
- A Firebase project (Firestore + Authentication enabled)

## 🔐 Firebase Configuration

Local dev reads from `src/app/firebase.config.local.ts` (gitignored but currently present as an example). Replace values with your own Web App config from Firebase Console:

```ts
export const firebaseEnv = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
  measurementId: '...',
} as const;
```

If you need different configs per environment, you can inject an alternate token or perform a build‑time replacement.

## ▶️ Development

Install deps:

```bash
npm install
```

Run the dev server (browser only, hydration currently disabled):

```bash
npm start
```

Visit http://localhost:4200

The Express SSR entry (`server.ts`) exists; to experiment with a local SSR build:

```bash
npm run build         # Produces dist/TaskZen
node dist/TaskZen/server/server.mjs
```

Then open http://localhost:4000

## 🧪 Testing

Run unit tests (Karma + Jasmine):

```bash
npm test
```

(No e2e framework configured yet; Cypress or Playwright can be added.)

## 🏗️ Building

Production build (optimization, budgets, etc.):

```bash
npm run build
```

Artifacts output to `dist/TaskZen`.

Build budgets
- Initial bundle warning: 800kB; error: 1.5MB (configured in `angular.json`).
- Component style warning: 4kB; error: 8kB.
  We will optimize bundles (code-split and trim dependencies) in a follow-up.

## 🧬 State Management Notes

- Root store composed in `app.store.module.ts`
- Feature slices (e.g., boards, tasks, auth) define actions, reducer, selectors under their folder
- Effects handle async (Firestore sync, auth flows)
- Components primarily bind to selectors or local signals (avoid heavy store logic in templates)

## 🧠 Signals Usage

- Local UI state (sidebar, breadcrumbs, theme accent) via `signal()` & `computed()`
- Derived breadcrumb list built reactively in root component
- Avoid `mutate`; use `set` / `update`

## 🌐 SSR / Server Notes

- `server.ts` sets up Express static hosting + universal request handling
- Currently hydration is disabled in `app.config.ts` (can be re‑enabled if SSR hydration is desired)
- `serve:ssr:TaskZen` script runs the built server bundle

## 🔔 Notifications & Toasts

- Activity feed & bell components backed by `notifications` feature slice
- Toast UI rendered via `ToastContainerComponent` with imperative service triggers

## 🎨 Theming

- Dark baseline; accent color stored via `ThemeService`
- Sidebar collapsed state persisted in `localStorage`

## 🚀 Roadmap Ideas

- Enable hydration & deploy SSR (e.g., Firebase Hosting + Functions)
- OAuth provider integrations (Google, GitHub) in `AuthEffects`
- Drag & drop enhancements / keyboard accessibility for kanban
- Offline queue & conflict resolution strategies
- E2E test suite (Playwright)

## 🤝 Contributing

1. Fork & clone
2. Create a feature branch
3. Commit using conventional messages if possible
4. Open a PR

## 📄 License

Currently unpublished license (assume All Rights Reserved unless a LICENSE file is added). Add a LICENSE to clarify reuse.

## 📚 Additional Angular CLI Help

List available schematics:

```bash
npx ng generate --help
```

## 🙋 Support

File an issue or start a discussion if you have questions or suggestions.

## 📅 Calendar & Planner

- Calendar (`/calendar`) shows:
  - Card-based events: cards that have a `dueDate` (ISO `YYYY-MM-DD`), styled by priority, with quick clear/open actions.
  - Standalone events: personal events stored in Firestore (`calendarEvents`) per user. Click the + button on a day to add; click ✕ to delete.
- Unscheduled panel lists cards without a due date, sorted by priority then title; quick buttons schedule into the next 7 days.
- Planner focus highlights focused cards in the calendar and in the unscheduled list.

Data model

- Calendar events in store include a `source` field: `'card' | 'event'`. Card events mirror the card and are not persisted separately. Standalone events are persisted.

Firestore collections

- `cards`: board-scoped; `dueDate` must be ISO `YYYY-MM-DD` or `null`.
- `plannerFocus/{uid}`: `{ ids: string[], updatedAt: number }` limited to 25 IDs per user.
- `calendarEvents/{eventId}`: `{ ownerId, title, date, createdAt, updatedAt }` owned by the creating user.

Security rules highlights (see `firestore.rules`)

- Auth required everywhere. Board access gated by membership.
- `cards.dueDate` validated as ISO date; comments/subtasks size capped.
- `plannerFocus` limited to 25 IDs and only readable/writable by its user.
- `calendarEvents` only readable/writable by their `ownerId`; `title` length capped; `date` validated.

---

Built with ❤️ using Angular signals & Firebase.
