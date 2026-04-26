import { test, expect } from '@playwright/test';

test.describe('Smoke · home pública', () => {
  test('la home carga y muestra el disclaimer formativo', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cartagenaeste/i);
    // Disclaimer formativo permanente (footer-global.js)
    const body = page.locator('body');
    await expect(body).toContainText(/formativ|docente|no diagn[óo]stica/i);
  });

  test('Service Worker se registra', async ({ page }) => {
    await page.goto('/');
    const swReady = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await navigator.serviceWorker.ready;
        return !!reg && !!reg.active;
      } catch {
        return false;
      }
    });
    expect(swReady).toBe(true);
  });

  test('botón de inicio de sesión visible y abre modal', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.locator('#tbLoginBtn');
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();
    await expect(page.locator('#loginModal.show, #loginModal[class*=show]')).toBeVisible();
    // Modal trae las dos vías: Google + email link (PR #98).
    await expect(page.locator('button.btn-google').first()).toBeVisible();
    await expect(page.locator('#emailLinkInput')).toBeVisible();
  });
});

test.describe('Smoke · páginas de pacientes', () => {
  test('la página de pacientes carga', async ({ page }) => {
    await page.goto('/pacientes.html');
    await expect(page.locator('body')).toContainText(/pacientes|recursos|prepara tu consulta/i);
  });

  test('recursos sociales muestra Atención Temprana', async ({ page }) => {
    await page.goto('/recursos-sociales.html');
    await expect(page.locator('body')).toContainText(/Atenci[óo]n Temprana/);
    await expect(page.locator('body')).toContainText(/0[\s-]a[\s-]6\s*años|0-6/i);
  });
});

test.describe('Smoke · páginas legales', () => {
  for (const path of ['/aviso-legal.html', '/privacidad.html']) {
    test(`${path} carga`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status()).toBeLessThan(400);
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});

test.describe('Smoke · status público', () => {
  test('status.html carga y muestra métricas agregadas', async ({ page }) => {
    const resp = await page.goto('/status.html');
    expect(resp?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(/status|estado|disponibilidad/i);
  });
});
