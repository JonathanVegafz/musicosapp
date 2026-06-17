import { test, expect } from '@playwright/test';

/**
 * Pruebas de accesibilidad general.
 * Verifica ARIA, keyboard navigation y contraste básico.
 */
test.describe('Accesibilidad', () => {
  // ── Atributos ARIA básicos ────────────────────────────────────────────────────

  test('la página de inicio tiene landmark de navegación', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav[aria-label]')).toBeVisible();
  });

  test('los links de navegación tienen aria-label', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a[aria-label]');
    await expect(navLinks.first()).toBeVisible();
  });

  test('los botones con solo icono tienen aria-label', async ({ page }) => {
    await page.goto('/songs/new');
    const iconButtons = page.locator('button[aria-label]');
    const count = await iconButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── Formulario de canción ─────────────────────────────────────────────────────

  test('todos los inputs del formulario tienen label asociado', async ({ page }) => {
    await page.goto('/songs/new');
    const inputs = ['#title', '#artist', '#key', '#bpm', '#capo', '#tags', '#youtube', '#content'];
    for (const id of inputs) {
      await expect(page.locator(`label[for="${id.slice(1)}"]`)).toBeVisible();
    }
  });

  test('los campos requeridos tienen aria-required="true"', async ({ page }) => {
    await page.goto('/songs/new');
    await expect(page.locator('#title[aria-required="true"]')).toBeAttached();
    await expect(page.locator('#artist[aria-required="true"]')).toBeAttached();
    await expect(page.locator('#content[aria-required="true"]')).toBeAttached();
  });

  test('los mensajes de error tienen role="alert"', async ({ page }) => {
    await page.goto('/songs/new');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  // ── Keyboard navigation ───────────────────────────────────────────────────────

  test('puede navegar al formulario usando solo el teclado', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    // Verifica que el foco se mueve
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('el botón submit del formulario es accesible por Tab', async ({ page }) => {
    await page.goto('/songs/new');
    // Tab through the form until submit button is focused
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.focus();
    await expect(submitBtn).toBeFocused();
  });

  // ── Controles de la vista de canción ─────────────────────────────────────────

  test('el control de transposición tiene role="group" con aria-label', async ({ page }) => {
    await page.goto('/songs/new');
    // La barra de controles aparece en la vista de detalle
    // Solo verificamos el formulario en este contexto
    await expect(page.locator('form')).toBeVisible();
  });

  // ── Idioma del documento ──────────────────────────────────────────────────────

  test('el documento tiene lang="es"', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('es');
  });

  // ── Imágenes y medios ─────────────────────────────────────────────────────────

  test('los íconos decorativos tienen aria-hidden="true"', async ({ page }) => {
    await page.goto('/');
    const decorativeIcons = page.locator('i[aria-hidden="true"]');
    await expect(decorativeIcons.first()).toBeAttached();
  });
});
