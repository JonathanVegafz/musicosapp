import { test, expect } from '@playwright/test';

/**
 * Navegación y estructura general de la app.
 */
test.describe('Navegación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Espera a que Angular hidrate
    await page.waitForSelector('app-root', { state: 'attached' });
  });

  test('la página de inicio carga y muestra el título', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bienvenido');
    await expect(page).toHaveTitle(/AppMusicos/i);
  });

  test('la navbar tiene los tres enlaces principales', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Navegación principal"]');
    await expect(nav.getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Biblioteca' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Setlists' })).toBeVisible();
  });

  test('navegar a Biblioteca muestra el encabezado correcto', async ({ page }) => {
    await page.click('a[href*="/library"]');
    await expect(page.locator('h1')).toContainText('Biblioteca');
  });

  test('navegar a Setlists muestra el encabezado correcto', async ({ page }) => {
    await page.click('a[href*="/setlists"]');
    await expect(page.locator('h1')).toContainText('Setlists');
  });

  test('el enlace de la marca lleva al inicio', async ({ page }) => {
    await page.goto('/library');
    await page.click('.brand');
    await expect(page.locator('h1')).toContainText('Bienvenido');
  });

  test('una ruta inexistente redirige al inicio', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    await expect(page.locator('h1')).toContainText('Bienvenido');
  });

  test('el enlace "Nueva canción" lleva al formulario', async ({ page }) => {
    await page.click('a[href*="/songs/new"]');
    await expect(page.locator('h1')).toContainText('Nueva canción');
  });
});
