# Clozera backend

Express and Mongoose application running on Node.js 24.22.1. Vite+ 1.3.0 provides
Oxlint, Oxfmt, Vitest and task orchestration. Install dependencies with `npm ci`; a global
`vp` installation is optional.

## Commands

| Command                                         | Behavior                                                       |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `npm start`                                     | Start the production server with Node                          |
| `npm run dev`                                   | Run the Vite+ `server:watch` task with Node's built-in watcher |
| `npm run check`                                 | Check formatting, lint and inferred types with Vite+           |
| `npm run lint` / `npm run lint:fix`             | Run Oxlint / apply its fixes                                   |
| `npm run format:check` / `npm run format:write` | Check / apply Oxfmt formatting                                 |
| `npm test`                                      | Run the 59 unit tests with Vite+ Vitest                        |
| `npm run test:integration`                      | Run the 35 integration tests                                   |
| `npm run test:all`                              | Run all 94 tests sequentially                                  |
| `npm run test:watch`                            | Watch unit tests                                               |
| `npm run test:coverage`                         | Collect unit-test coverage                                     |
| `npm run test:debug`                            | Run verbose unit tests with hanging-process diagnostics        |

Seed and admin scripts remain ordinary Node commands. See `.env.example` and
`.env.test.example` for the corresponding environment settings.

## Configuration and tests

`vite.config.mjs` contains lint, format and test configuration. The backend uses
native ES Modules (`"type": "module"`), with explicit `.js` extensions on relative
imports. Models and routers have default exports; services, controllers and helpers
have named exports. Node starts the application directly without a build step.
`src/config/environment.js` loads dotenv before the database connection is evaluated.
The seed script resolves its default data path with `import.meta.dirname`.

Tests use ESM `.test.mjs` files and import APIs from `vite-plus/test`. They import
the application directly and replace model/service methods with `vi.spyOn`.
Spies are restored after each suite. Vitest's `deps.interopDefault` is disabled
to match Node's native handling of CommonJS dependencies, particularly the
`passport-local-mongoose` default export. No `createRequire` bridge is needed.

`npm test` selects the `unit` project, `npm run test:integration` selects the
`integration` project, and `npm run test:all` (or `npm exec -- vp test run`) runs
both. Tests run in isolated fork processes. File parallelism is disabled because
integration suites share and clear a database. Set `TEST_MONGODB_CONNECTION_STRING`
to a dedicated local test database; the application variable
`MONGODB_CONNECTION_STRING` is never used as a fallback. Copy `.env.test.example`
to `.env.test.local` when first setting up tests. Guards require `NODE_ENV=test`,
a `mongodb://` URI and a database named `clozera-test` or `clozera_test`, optionally
followed by a `-`/`_` suffix (for example `clozera_test_upgrade`). Allowed hosts are
`localhost`, `127.0.0.1`, `::1`, `mongo`, `mongodb` and `host.docker.internal`.
Atlas and other remote hosts are rejected. The active connection's database and
host and port are checked again immediately before collection deletion.
The test configuration sets `NODE_ENV=test` and `DOTENV_CONFIG_PATH` so the app
loads `.env.test.local`; an explicitly supplied connection string takes precedence.

`npm run test:watch` watches unit tests through Vite's ESM dependency graph;
no CommonJS-wide rerun trigger is needed. Exit watch mode with `q`.

Coverage uses `@vitest/coverage-v8`, pinned to the bundled Vitest version, and
writes HTML and LCOV reports under `coverage/`. `test:coverage` covers unit tests;
use `npm run test:all -- --coverage` for both projects with a disposable database.
`test:debug` uses Vitest's verbose and hanging-process reporters; it replaces the
old Jest open-handle diagnostic and does not attach an interactive debugger.

`vp dev` starts Vite's frontend dev server. For this Express backend use
`npm run dev` (or `npm exec -- vp run server:watch`). Production uses `npm start`
without a Vite+ runtime dependency or bundling step.

## Docker

Development uses `Dockerfile`, which installs development tools and the Vite+
configuration; Docker Compose mounts `src/` for automatic restarts. Production
uses `Dockerfile.production` and `npm ci --omit=dev`, then starts Node directly as PID 1 so container shutdown signals reach the server.

## Server lifecycle and readiness

`npm start` and `npm run dev` connect to MongoDB before constructing the session
store and opening the HTTP port. Missing configuration or an initial connection
failure exits with a nonzero status; server selection is bounded to five seconds.
Importing `app.js` alone does not initiate a database connection.

`GET /health/ready` returns `200 { "status": "ready" }` when Mongoose reports an
established connection, and `503 { "status": "not_ready" }` after disconnection
or when shutdown starts. This probe reports connection state without executing a
query, does not create a session, and disables response caching. Compose uses it
for the API healthcheck instead of only checking that the TCP port is open.

On `SIGTERM` or `SIGINT`, the server marks itself not ready, stops accepting new
connections, waits for active HTTP requests to finish, then disconnects MongoDB.
Shutdown is idempotent and bounded to eight seconds. If requests or database
cleanup exceed that deadline, remaining HTTP connections are closed and the
process exits with status 1. Normal shutdown exits with status 0.
