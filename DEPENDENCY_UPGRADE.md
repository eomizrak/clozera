> Historical upgrade notes: the frontend has since migrated to React, React Router,
> Zustand and shadcn/ui. The Vue/Pinia/PrimeVue details below describe the previous
> stack. See [frontend/README.md](frontend/README.md) for the current setup.

# Dependency upgrade and Vite+ migration

## Scope and decisions

The frontend and backend remain separate npm projects, each with its own lockfile.
Direct dependencies were checked against the npm registry's `latest` tag on
2026-10-22, and transitive dependencies were updated within their supported ranges.

PrimeVue remains on 4.5.5 and `@primeuix/themes` on the compatible 2.0.3 release,
as requested. PrimeVue 5 introduces license-key verification and displays a banner
when verification fails. See the [PrimeVue 5 release notes](https://blog.primeui.dev/blog/primevue-5-0-0/).

After validating the dependency upgrade, the frontend was migrated to Vite+ 1.3.0.
The backend was subsequently migrated to Vite+ 1.3.0 for lint, format and task
orchestration and Vitest testing. The Express backend now uses native ES Modules. Vite+ itself is
free and open source under the MIT license; see the [official project](https://viteplus.dev/).

## Main version changes

| Area | Before (manifest) | After |
| --- | --- | --- |
| Vue | 3.5.32 | 3.5.44 |
| Vue Router | 5.0.4 | 5.4.0 |
| Pinia | 3.0.4 | 4.1.0 |
| Lucide Vue | 1.14.0 | 1.60.0 |
| Vite | 8.0.8 | 8.3.4 |
| Vitest | 4.1.4 | 5.0.5 |
| jsdom | 29.0.2 | 30.1.3 |
| Frontend toolchain | Separate Vite/Vitest/Oxlint/Prettier packages | Vite+ 1.3.0 |
| ESLint (both projects) | 10.2.1 | 10.13.0 |
| Backend lint and format | ESLint / Prettier | Vite+ Oxlint / Oxfmt |
| Axios (frontend / backend) | 1.16.0 / 1.15.0 | 1.20.0 |
| Express | 5.2.1 | 5.3.0 |
| Mongoose | 9.4.1 | 9.11.2 |
| dotenv | 17.4.2 | 18.0.8 |
| Jest | 30.3.0 | Removed; Vite+ Vitest 5.0.5 |

The manifests and lockfiles contain the complete dependency changes. Vite+ 1.3.0
bundles Vite 8.3.4, Vitest 5.0.5, Oxlint 1.88.0 and Oxfmt 0.73.0. Bundled tool
versions follow Vite+'s tested release rather than independent package updates.

## Runtime and compatibility

- Both `.node-version` files and all Node Docker stages select Node 24.22.1.
  This retains the existing Node 24 deployment line and includes the
  [October 21 security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
  This change does not install or switch the developer's global Node runtime.
- The engine ranges now reflect the updated toolchain, including jsdom 30:
  `^22.22.2 || ^24.15.0 || >=26.0.0`.
- Pinia 4 is ESM-only; the frontend already uses ESM. npm installs its devtools
  peer dependency. See the [Pinia 4 release](https://github.com/vuejs/pinia/releases/tag/v4.0.0).
- Vitest 5 passes all existing tests with its defaults; no v4 compatibility flags
  were needed. Test configuration lives in `vite.config.js`, and `.vitest/` is ignored.
  See the [Vitest migration guide](https://vitest.dev/guide/migration/).
- dotenv uses its configuration API; the project does not rely on the removed
  preload interface. A dedicated environment module loads it before the database
  connection under ESM.
- The initial Jest run required the MongoDB driver OS adapter workaround
  [NODE-7832](https://jira.mongodb.org/browse/NODE-7832). After migration to
  Vite+ Vitest, the workaround was removed and integration tests pass without it.
- Seven backend files were formatted with the updated Prettier to satisfy the
  existing format check. Their application behavior and test assertions are unchanged.

## Validation and remaining observations

- Clean `npm ci` succeeds in each project.
- Frontend: 7 test files / 24 tests pass; ESLint and Oxlint pass; production build passes.
- Backend: 12 test suites / 94 tests pass, including all 35 integration tests.
  The integration run uses a disposable MongoDB container and a dedicated database.
- Both suites also pass inside the Node 24.22.1 Alpine development images.
- Both production Docker images build successfully with Node 24.22.1.
- Frontend audit: 0 reported vulnerabilities, including development dependencies.
- Backend production audit (`npm audit --omit=dev`): 0 reported vulnerabilities.
- Backend full audit after Jest removal: 0 reported vulnerabilities. The previous
  19 moderate entries came from Jest's transitive dependencies and are removed.
- The frontend build reports a JS chunk above 500 kB (about 634 kB uncompressed).
  Route splitting can be evaluated separately; the size warning does not fail the build.

## Reproduce the checks

Use the Node version selected by `.node-version`, then run:

```sh
cd frontend
npm ci
npm run check
npm run test:unit -- --run
npm run build

cd ../backend
npm ci
npm run lint
npm run format:check
npm test
```

Integration tests delete collections in their configured database. Use a dedicated
test database. For example, start a disposable instance:

```sh
docker run --detach --rm --pull=always --name clozera-upgrade-test-mongo \
  --publish 127.0.0.1:27028:27017 mongo:8.0
```

After MongoDB is ready, run from `backend/`:

```sh
TEST_MONGODB_CONNECTION_STRING=mongodb://127.0.0.1:27028/clozera_test_upgrade npm run test:all
docker stop clozera-upgrade-test-mongo
```

## Completed Vite+ migration

The official Vite+ 1.3.0 migrator ran from `frontend/`, with hooks, agent generation
and editor generation disabled. npm remains the package manager. No root workspace
conversion or backend test-runner migration was performed.

- Development, build, preview and test scripts invoke the local `vp` binary.
- Vite configuration, jsdom tests, Oxlint and Oxfmt are consolidated in
  `frontend/vite.config.js`; the separate Vitest configuration was removed.
- The `@` alias, Vue plugin and Vue DevTools are preserved. Plugin initialization
  uses `lazyPlugins`, as generated by the migrator.
- All seven test files import from `vite-plus/test`. Their 24 tests and assertions
  are preserved.
- `vite` is an npm alias for `@voidzero-dev/vite-plus-core@1.3.0`, including an
  override for plugin consumers. The Vitest override is pinned to bundled 5.0.5
  so ESLint integrations and Vite+ use a single test-runner version.
- The migrator reported 57 ESLint rules it could not translate. ESLint was retained
  with its recommended JavaScript, Vue essential and existing test-rule configuration.
  `npm run check` runs Vite+ checks followed by ESLint. `npm run lint` runs both
  linters without modifying files. Vue compiler macros are declared readonly only
  for `.vue` files in the Oxlint configuration.
- Prettier and standalone Oxlint dependencies/configuration were removed from the
  frontend. Oxfmt preserves semicolon, quote and line-width preferences. Source
  formatting changes were reviewed separately from test-import changes.
- The generated Vue module declaration in `src/env.d.ts` is retained. This remains
  a JavaScript application; these checks do not imply full Vue template type coverage.
- The development Dockerfile no longer copies the removed Vitest configuration.
  Production builds continue to use `npm ci` and `npm run build`.
- `frontend/README.md` and local frontend agent instructions describe the new tools.

Validation after migration:

- Clean `npm ci`, `npm run check`, frontend tests and production builds pass.
- Node 24.22.1 Alpine Docker checks and frontend tests pass.
- Backend's 94 tests are rerun against an isolated disposable MongoDB instance.
- The Vite+ development server renders the home, login and sign-up screens with
  no captured browser console warnings or errors. Authenticated browser flows
  were not exercised; the existing store and backend integration tests remain green.
- The production frontend Docker image builds and serves nested routes.
- No Vitest v4 compatibility settings were generated or retained: the source
  project was already validated on Vitest 5 before this migration.

## Completed backend Vite+ migration

Backend dependencies were rechecked against npm's latest tag, with no outdated
direct dependencies before migration. The official Vite+ 1.3.0 migrator then
converted ESLint and Prettier configuration into `backend/vite.config.mjs`.
The application, CLI scripts and tests now use native ES Modules.

- Lint and format use bundled Oxlint/Oxfmt; standalone ESLint, Prettier and unused
  lint globals dependencies were removed. Formatting options and ignores were
  retained, including excluding local seed data from formatting.
- Backend lint uses the correctness category at error severity plus explicit
  rules outside that category. Unused variables and style preferences remain
  warnings. Debugger statements are always errors; console logging is allowed
  for the server and maintenance scripts. Lint behavior is independent of
  `NODE_ENV`. Redundant environment overrides and formatter defaults were removed.
  The migrator skipped `no-dupe-args` and `no-octal` as unsupported, describing them
  as superseded by strict-mode syntax checks. They are not separately enforced by
  ESLint after this migration.
- Nodemon was replaced by Node's built-in `--watch`, invoked via a Vite+ task.
- Test commands now call `vp test` directly using its built-in Vitest 5.0.5 runner.
  Unit and integration projects preserve the original 75 tests, with sequential file
  execution for the shared integration database. Watch, V8 coverage and verbose
  hanging-process diagnostic commands replace their Jest equivalents.
- Test files use `.test.mjs`, import APIs from `vite-plus/test`, and import backend
  ES Modules directly. `vi.spyOn` replaces model/service methods and spies are
  restored after each suite. The former `createRequire` bridge and broad CommonJS
  watch triggers were removed. Vitest uses `deps.interopDefault: false` to match
  Node's native interop behavior for CommonJS third-party dependencies.
- Backend `package.json` uses `type: module`. Relative imports include `.js`;
  app/models/routers use default exports and helpers/services/controllers use
  named exports. The environment loader runs before the database connection.
  Seed paths use `import.meta.dirname`. No bundling step is required.
- Jest was removed. `@vitest/coverage-v8` and the Vitest override are pinned to
  5.0.5 to match Vite+ 1.3.0; update these pins together on future tool upgrades.
- Test URL construction explicitly converts MongoDB ObjectIds to strings to meet
  the newly enabled type-aware lint rules, without changing test assertions.
- `npm start`, seed and admin scripts remain Node runtime commands. Production
  installs omit development dependencies and require no Vite+ binary.
- The development Dockerfile includes the Vite+ configuration for its new tasks.
  The backend command reference is in `backend/README.md`.

Validation includes a clean install, Vite+ checks, 59 unit tests, all 94 tests
against a disposable MongoDB instance, coverage and open-handle detection commands,
and development/production Docker checks on Node 24.22.1.
Both the Vite+ watch task and the production Node entry point were started in
containers and returned HTTP 200 with `{ "data": null }` for an unauthenticated
session request. Native ESM admin bootstrap and seed scripts were also exercised
against a disposable database with synthetic data, including the default seed path.
The production smoke check loaded its database URI, session settings and port from
a separate dotenv file, verifying that environment loading precedes startup.
All temporary servers and databases were removed after testing.

## Future updates

Update Vite+, its aliased Vite core, the Vitest override and `@vitest/coverage-v8`
together using the official migration workflow. Review aliases, overrides and
bundled versions as a set; do not update these pins independently.

References: [migration guide](https://viteplus.dev/guide/migrate),
[migration rules](https://viteplus.dev/guide/migrate-rules),
[project-local CLI](https://viteplus.dev/guide/local-cli).

## Maintenance safeguards

- Integration helpers require `TEST_MONGODB_CONNECTION_STRING` and validate both
  the requested local test target and the active connection before any deletion.
  The application URI is never a fallback. Existing `.env.test.local` files must
  use the new variable; `.env.test.example` documents the default.
- The HTTP entry point waits for MongoDB before opening its port. Compose probes
  `/health/ready`; SIGTERM/SIGINT drain HTTP requests before closing MongoDB, with
  an eight-second forced-shutdown deadline. The production image runs Node as PID 1.
- Database guard and readiness regressions extend the backend suite to 94 tests
  (59 unit, 35 integration).
- Production lifecycle smoke checks verified readiness HTTP 200, completion of an
  in-flight request after SIGTERM with exit 0, SIGINT exit 0, forced exit 1 after
  the eight-second deadline, and a closed HTTP port plus exit 1 when MongoDB is
  unavailable. These checks used disposable containers and a separate database.
