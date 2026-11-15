# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Build the React screens as route-level views that call the shared API client and render loading, empty, and error states in a way that is accessible to screen readers. Keep presentation logic focused on display and user flow; the data fetch and state orchestration stay local to each page component.
- Logic tier decision: Implement the /api contract in typed Express routes plus small service helpers so validation, aggregation, and suggestion logic stay testable and consistent across endpoints. Prefer explicit 4xx responses for invalid IDs and missing users instead of letting Mongoose cast errors escape as 500s.
- Data tier decision: Use Mongoose schemas to enforce required fields, default collections, and relational references for users, teams, activities, and workouts. Keep the seeding script idempotent so repeated runs preserve existing seeded records while adding missing demo data.
- Activity tracking approach: Accept userId and teamId, validate they are valid ObjectIds, ensure the referenced user and team exist, and store the submitted fields plus computed points and occurredAt. Reject invalid payloads with a deliberate 400-range status and never rely on unhandled cast exceptions.
- Team management approach: Require a team name and mascot, default members to an empty array, and preserve member references as ObjectIds so listing a team exposes the linked user IDs in a stable shape.
- Leaderboard approach: Aggregate activities by team, sum total points, sort descending, and assign a 1-based rank to each team entry. This makes the top-of-page leaderboard deterministic and testable.
- Workout suggestions approach: Look up the user by email, infer the recent focus from that user’s goal or last activity type, and return workouts sorted so the first suggestion matches that focus with a human-readable reason explaining the recommendation.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the Mongoose contract and seed behavior. Failures here point to schema validation gaps, missing defaults, or data shape mismatches before API work begins.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates the HTTP contract for activities, teams, leaderboard, and workout suggestions. Failures usually mean route logic, validation, aggregation logic, or error mapping is still incomplete.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates the React UI contract: route rendering, fetch calls, loading states, empty states, and accessible error alerts. Failures here indicate the browser-facing presentation layer is still using placeholders instead of real API-driven content.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks TypeScript and app compatibility for the Express backend. A failing build catches bad imports, typing issues, or invalid server code before deployment.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks the React/Vite build and TypeScript compilation. A failing frontend build shows broken component code, route wiring, or missing API-client contracts.
