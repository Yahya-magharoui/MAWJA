import { expect, test } from '@playwright/test';
import { seedAuthenticatedSession, seedGuestSession } from './helpers/session';

test.describe('patient app flows', () => {
  test('landing page keeps doctor signup hidden', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Médecin' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Patient' })).toHaveCount(0);
  });

  test('guest can access tolerance but sees protected sections locked', async ({ page }) => {
    await seedGuestSession(page);
    await page.goto('/tolerance');

    await expect(page.getByRole('heading', { name: 'Fenêtre de tolérance' })).toBeVisible();
    await expect(page.getByText('Roue des émotions')).toBeVisible();
    await expect(page.getByText('Connexion requise')).toHaveCount(5);
    await expect(page.getByText('Connecte-toi pour accéder à tes objectifs, notes, routine et historique')).toBeVisible();
  });

  test('back from emotions returns to tolerance when opened from tolerance', async ({ page }) => {
    await seedGuestSession(page);
    await page.goto('/tolerance');

    await page.getByRole('link', { name: 'Roue des émotions' }).click();
    await expect(page.getByRole('heading', { name: 'Roue des émotions' })).toBeVisible();
    await page.getByLabel('Retour').click();

    await page.waitForURL('**/tolerance');
    await expect(page.getByRole('heading', { name: 'Fenêtre de tolérance' })).toBeVisible();
  });

  test("back from help returns to app when opened from the home screen", async ({ page }) => {
    await seedGuestSession(page);
    await page.goto('/app');

    await page.getByRole('button', { name: "J’ai besoin d’aide" }).click();
    await expect(page.getByRole('heading', { name: 'Numéros d’urgence' })).toBeVisible();
    await page.getByLabel('Retour').click();

    await page.waitForURL('**/app');
    await expect(page.getByRole('heading', { name: 'Comment te sens-tu maintenant ?' })).toBeVisible();
  });

  test('authenticated patient sees the initial check-in popup once', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    await page.goto('/app');

    await expect(page.getByRole('heading', { name: 'Comment tu te sens maintenant ?' })).toBeVisible();
    await page.getByRole('button', { name: 'Plus tard' }).click();
    await expect(page.getByRole('heading', { name: 'Comment tu te sens maintenant ?' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Comment tu te sens maintenant ?' })).toHaveCount(0);
  });

  test('authenticated patient can logout from the logout popup with later', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    await page.goto('/app');

    await page.getByRole('button', { name: 'Plus tard' }).click();
    await page.getByRole('button', { name: 'Paramètres' }).click();
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await expect(page.getByText('Avant la déconnexion')).toBeVisible();
    await page.route('https://mawja-back.onrender.com/api/histories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 42, state: 'TOLERANCE' }),
      });
    });
    await page.getByRole('button', { name: 'Plus tard' }).click();

    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible();
  });

  test('doctor account only sees the placeholder screen', async ({ page }) => {
    await seedAuthenticatedSession(page, 'DOCTOR');
    await page.goto('/app');

    await expect(page.getByRole('heading', { name: 'Espace médecin', exact: true })).toBeVisible();
    await expect(page.getByText('L’espace médecin est temporairement masqué avant le déploiement.')).toBeVisible();
    await expect(page.getByText('Dashboard medecin')).toHaveCount(0);
  });
});
