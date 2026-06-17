import { test, expect } from '@playwright/test';

/**
 * Gestión de setlists.
 */
test.describe('Setlists', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/setlists');
    await page.waitForSelector('h1', { state: 'visible' });
  });

  // ── Estructura ──────────────────────────────────────────────────────────────

  test('muestra el encabezado "Setlists"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Setlists');
  });

  test('muestra el botón "Nueva setlist"', async ({ page }) => {
    await expect(page.getByRole('button', { name: /nueva setlist/i })).toBeVisible();
  });

  // ── Estado vacío ─────────────────────────────────────────────────────────────

  test('muestra estado vacío cuando no hay setlists', async ({ page }) => {
    const empty = page.locator('.empty');
    const hasEmpty = await empty.isVisible().catch(() => false);
    if (hasEmpty) {
      await expect(empty).toContainText('No hay setlists todavía');
    }
  });

  // ── Modal crear setlist ──────────────────────────────────────────────────────

  test('abre el modal al hacer clic en Nueva setlist', async ({ page }) => {
    await page.getByRole('button', { name: /nueva setlist/i }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('#modal-title')).toContainText('Nueva Setlist');
  });

  test('el modal tiene los campos nombre, fecha y descripción', async ({ page }) => {
    await page.getByRole('button', { name: /nueva setlist/i }).first().click();
    await expect(page.locator('#sl-name')).toBeVisible();
    await expect(page.locator('#sl-date')).toBeVisible();
    await expect(page.locator('#sl-desc')).toBeVisible();
  });

  test('muestra error al enviar el modal sin nombre', async ({ page }) => {
    await page.getByRole('button', { name: /nueva setlist/i }).first().click();
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
  });

  test('el modal se cierra al hacer clic en Cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /nueva setlist/i }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('[role="dialog"] button:has-text("Cancelar")').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('el modal se cierra al hacer clic fuera de él', async ({ page }) => {
    await page.getByRole('button', { name: /nueva setlist/i }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('.modal-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  // ── Accesibilidad del modal ──────────────────────────────────────────────────

  test('el modal tiene aria-modal y aria-labelledby', async ({ page }) => {
    await page.getByRole('button', { name: /nueva setlist/i }).first().click();
    const backdrop = page.locator('.modal-backdrop');
    await expect(backdrop).toHaveAttribute('aria-modal', 'true');
    await expect(backdrop).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});
