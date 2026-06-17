import { test, expect } from '@playwright/test';

/**
 * Formulario de creación de canciones.
 * Nota: las pruebas que crean datos reales requieren Supabase activo.
 * Las pruebas de validación y UI corren sin backend.
 */
test.describe('Formulario de canción', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/songs/new');
    await page.waitForSelector('h1', { state: 'visible' });
  });

  // ── Estructura ──────────────────────────────────────────────────────────────

  test('muestra el título correcto', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Nueva canción');
  });

  test('todos los campos requeridos están presentes', async ({ page }) => {
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#artist')).toBeVisible();
    await expect(page.locator('#key')).toBeVisible();
    await expect(page.locator('#content')).toBeVisible();
  });

  test('campos opcionales están presentes', async ({ page }) => {
    await expect(page.locator('#bpm')).toBeVisible();
    await expect(page.locator('#capo')).toBeVisible();
    await expect(page.locator('#tags')).toBeVisible();
    await expect(page.locator('#youtube')).toBeVisible();
  });

  // ── Validación de formulario ─────────────────────────────────────────────────

  test('muestra errores al intentar enviar sin datos', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('muestra error de título requerido', async ({ page }) => {
    await page.locator('#artist').fill('Hillsong');
    await page.locator('#content').fill('[G]Test');
    await page.click('button[type="submit"]');
    await expect(page.getByText('El título es requerido')).toBeVisible();
  });

  test('muestra error de artista requerido', async ({ page }) => {
    await page.locator('#title').fill('Mi canción');
    await page.locator('#content').fill('[G]Test');
    await page.click('button[type="submit"]');
    await expect(page.getByText('El artista es requerido')).toBeVisible();
  });

  test('muestra error de letra requerida', async ({ page }) => {
    await page.locator('#title').fill('Mi canción');
    await page.locator('#artist').fill('Hillsong');
    await page.click('button[type="submit"]');
    await expect(page.getByText('La letra es requerida')).toBeVisible();
  });

  // ── Vista previa en tiempo real ──────────────────────────────────────────────

  test('la vista previa se actualiza al escribir la letra', async ({ page }) => {
    await page.locator('#content').fill('[G]Cristo vive [D]Cristo reina');
    // La vista previa debería mostrar los acordes y la letra
    const preview = page.locator('.preview-panel');
    await expect(preview).toContainText('G');
    await expect(preview).toContainText('Cristo vive');
  });

  test('muestra mensaje placeholder cuando la letra está vacía', async ({ page }) => {
    await expect(page.locator('.preview-empty')).toBeVisible();
  });

  test('la tonalidad del preview se actualiza con el selector', async ({ page }) => {
    await page.locator('#key').selectOption('A');
    await expect(page.locator('.preview-key')).toContainText('A');
  });

  // ── Selector de tonalidad ────────────────────────────────────────────────────

  test('el selector de tonalidad incluye notas naturales y alteradas', async ({ page }) => {
    const options = page.locator('#key option');
    await expect(options).toHaveCount(31); // 17 mayores + 14 menores aprox.
    await expect(page.locator('#key option[value="G"]')).toBeAttached();
    await expect(page.locator('#key option[value="Am"]')).toBeAttached();
  });

  // ── Navegación ───────────────────────────────────────────────────────────────

  test('el botón Cancelar vuelve a la Biblioteca', async ({ page }) => {
    await page.click('a:has-text("Cancelar")');
    await expect(page.locator('h1')).toContainText('Biblioteca');
  });

  test('el enlace Biblioteca del breadcrumb vuelve a la Biblioteca', async ({ page }) => {
    await page.click('a.back-btn');
    await expect(page.locator('h1')).toContainText('Biblioteca');
  });
});
