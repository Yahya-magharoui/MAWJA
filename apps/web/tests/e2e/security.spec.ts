import { expect, test } from '@playwright/test';
import { seedGuestSession } from './helpers/session';

test('critical pages are protected by CSP without browser violations', async ({ page }) => {
  const cspViolations: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /content security policy/i.test(message.text())) {
      cspViolations.push(message.text());
    }
  });

  await seedGuestSession(page);

  for (const path of ['/', '/app', '/privacy', '/terms']) {
    const response = await page.goto(path);
    const policy = response?.headers()['content-security-policy'] ?? '';

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    await expect(page.locator('body')).toBeVisible();
  }

  expect(cspViolations).toEqual([]);
});
