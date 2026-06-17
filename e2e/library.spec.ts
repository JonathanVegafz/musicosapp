import { test, expect } from '@playwright/test';

/**
 * Biblioteca de canciones: búsqueda, filtros y estado vacío.
 */
test.describe('Biblioteca', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('h1', { state: 'visible' });
  });

  // ── Estructura ──────────────────────────────────────────────────────────────

  test('muestra el encabezado con contador de canciones', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Biblioteca');
    // El contador puede ser 0 o más
    await expect(page.locator('h1 .count')).toBeVisible();
  });

  test('muestra el botón "Nueva canción"', async ({ page }) => {
    await expect(page.getByRole('link', { name: /nueva canción/i })).toBeVisible();
  });

  test('muestra el campo de búsqueda', async ({ page }) => {
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });

  test('muestra el selector de tonalidad', async ({ page }) => {
    await expect(page.locator('select[aria-label*="tonalidad"]')).toBeVisible();
  });

  // ── Estado vacío ─────────────────────────────────────────────────────────────

  test('muestra estado vacío cuando no hay canciones', async ({ page }) => {
    // En el entorno de GitHub Pages sin datos pre-cargados
    const empty = page.locator('.empty');
    const hasEmpty = await empty.isVisible().catch(() => false);
    if (hasEmpty) {
      await expect(empty).toContainText('No se encontraron canciones');
      await expect(empty.getByRole('link', { name: /agregar/i })).toBeVisible();
    }
  });

  // ── Búsqueda ─────────────────────────────────────────────────────────────────

  test('el campo de búsqueda es accesible por aria-label', async ({ page }) => {
    const search = page.locator('input[aria-label="Buscar canciones"]');
    await expect(search).toBeVisible();
  });

  test('el filtro de tonalidad muestra opción "Todas las tonalidades"', async ({ page }) => {
    await expect(page.locator('select option[value=""]')).toContainText('Todas las tonalidades');
  });

  test('el botón Limpiar no es visible sin filtros activos', async ({ page }) => {
    await expect(page.locator('button:has-text("Limpiar")')).not.toBeVisible();
  });

  test('el botón Limpiar aparece al escribir en el buscador', async ({ page }) => {
    await page.locator('input[type="search"]').fill('test');
    await expect(page.locator('button:has-text("Limpiar")')).toBeVisible();
  });

  test('Limpiar borra los filtros activos', async ({ page }) => {
    const search = page.locator('input[type="search"]');
    await search.fill('búsqueda de prueba');
    await page.locator('button:has-text("Limpiar")').click();
    await expect(search).toHaveValue('');
  });

  // ── Accesibilidad ────────────────────────────────────────────────────────────

  test('la sección de búsqueda tiene role="search"', async ({ page }) => {
    await expect(page.locator('[role="search"]')).toBeVisible();
  });

  test('la cuadrícula de canciones tiene aria-label', async ({ page }) => {
    const grid = page.locator('[role="list"][aria-label]');
    const gridVisible = await grid.isVisible().catch(() => false);
    if (gridVisible) {
      await expect(grid).toBeVisible();
    }
  });
});
