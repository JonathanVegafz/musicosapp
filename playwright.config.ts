import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para MúsicosApp.
 * Apunta a la versión desplegada en GitHub Pages.
 * Para correr contra local: cambia baseURL a 'http://localhost:4200'
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env['BASE_URL'] ?? 'https://jonathanvegafz.github.io/musicosapp',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-ES',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
