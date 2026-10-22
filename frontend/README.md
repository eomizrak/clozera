# Clozera frontend

Vue 3 application using Vite+ 1.3.0 for development, production builds, Vitest,
Oxlint and Oxfmt. Use Node.js 24.22.1 and npm. The project-local `vp` binary is
installed by npm; no global Vite+ installation is required.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

Vite, tests, lint and format settings live in `vite.config.js`.
See the [Vite+ configuration reference](https://viteplus.dev/config/).
ESLint is retained in `eslint.config.js` for Vue template checks that Oxlint does
not yet support. `npm run check` runs both tools.

## Project Setup

```sh
npm ci
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

For a single test run:

```sh
npm run test:unit -- --run
```

Import test APIs from `vite-plus/test`. Vite and Vitest package overrides must stay
aligned with the installed Vite+ toolchain; inspect it with `npm exec -- vp toolchain`.

### Check formatting, lint and Vue templates

```sh
npm run check
```

### Lint with Oxlint and ESLint

```sh
npm run lint
```

### Format source files with Oxfmt

```sh
npm run format
```

`npm run format:check` checks formatting without changing files.
