# Musicos

App de gestión de canciones y setlists para músicos, construida con Angular 21 y Supabase como backend. Generada con [Angular CLI](https://github.com/angular/angular-cli) 21.1.3.

## Configuración (Supabase)

El backend de datos es Supabase. Las credenciales se leen desde un archivo `.env` en la raíz del repo (gitignoreado) y se inyectan en `src/environments/environment.ts` mediante `scripts/set-env.js`.

1. Copia el ejemplo y rellena tus valores:

   ```bash
   cp .env.example .env
   ```

2. En `.env` usa la **anon public key** de Supabase (Dashboard → Project Settings → API), **nunca** la `service_role` key (bypassa Row Level Security).

3. Genera el environment (también se ejecuta solo en `postinstall`, `start`, `build` y `test`):

   ```bash
   npm run config
   ```

> Asegúrate de tener **Row Level Security** habilitado en todas las tablas (`songs`, `setlists`, `setlist_songs`, `setlist_members`) con sus policies.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Linting

```bash
npm run lint
```

## Running unit tests

Unit tests run with the [Vitest](https://vitest.dev/) test runner:

```bash
npm test
```

## Running end-to-end tests

E2E tests use [Playwright](https://playwright.dev/) (specs in `e2e/`). First time:

```bash
npx playwright install chromium
```

Run against local dev server:

```bash
BASE_URL=http://localhost:4200 npx playwright test
```

Or against the deployed site (default `BASE_URL`):

```bash
npx playwright test
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
