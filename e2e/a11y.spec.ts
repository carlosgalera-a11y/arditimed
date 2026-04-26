import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Audit WCAG 2.1 AA con axe-core.
 *
 * Página por página: ejecuta axe, exporta JSON detallado, fail si hay
 * violaciones de impacto critical/serious. Las moderate/minor se loguean
 * pero no fallan el CI (objetivo iterativo).
 */

const PAGES_PUBLICAS = [
  '/',
  '/aviso-legal.html',
  '/privacidad.html',
  '/transparencia.html',
  '/status.html',
  '/pacientes.html',
  '/recursos-sociales.html',
  '/prepara-consulta.html',
  '/dejar-fumar.html',
];

for (const path of PAGES_PUBLICAS) {
  test(`a11y · WCAG 2.1 AA · ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Adjuntar reporte completo al test
    await testInfo.attach('axe-results.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });

    const critical = results.violations.filter(v => v.impact === 'critical');
    const serious = results.violations.filter(v => v.impact === 'serious');
    const moderate = results.violations.filter(v => v.impact === 'moderate');

    if (moderate.length > 0) {
      console.log(`[${path}] moderate violations: ${moderate.map(v => v.id).join(', ')}`);
    }

    expect.soft(critical, `critical: ${critical.map(v => v.id).join(', ')}`).toEqual([]);
    expect.soft(serious, `serious: ${serious.map(v => v.id).join(', ')}`).toEqual([]);
  });
}
