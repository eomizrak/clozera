# Clozera frontend

React application using React Router, Zustand, Tailwind CSS v4 and shadcn/ui.
Vite+ handles development, production builds, Vitest, Oxlint and Oxfmt.
Use Node.js 24.22.1 and npm.

## Development

```sh
npm ci
npm run dev
```

Set `VITE_API_BASE_URL` to the backend origin (defaults to `http://localhost:3000`).
The API uses cookie-based sessions; requests include credentials.

## Validation

```sh
npm run test:unit -- --run
npm run build
npm run check
```

`npm run lint` runs Oxlint. `npm run format` formats the project and
`npm run format:check` checks formatting. Test APIs come from `vite-plus/test`.

## UI components

Use the shadcn/ui components in `src/components/ui` for interface controls.
These are source files installed by the official CLI, not a component npm package.
Add components with `npx shadcn@latest add <component>`; `components.json` defines
the JavaScript, Radix, New York and alias configuration. Theme tokens are in
`src/assets/main.css` and retain Clozera's orange palette.

Application components compose shadcn primitives for shared domain behavior:
navigation, collection cards/forms, sentence authoring and practice setup.
Create a custom control only when shadcn cannot cover the requirement.

Routing preserves the existing public URLs, authentication redirects and mandatory
language selection. Zustand stores preserve the backend contracts; framework-free
learning helpers remain in `src/lib`. Dashboard tab/scroll state stays in sessionStorage.

See [the shared UI and practice standards](../doc/frontend-ui.md) for design tokens,
layout utilities, answer modes, session sizes and the planned listening activity.
