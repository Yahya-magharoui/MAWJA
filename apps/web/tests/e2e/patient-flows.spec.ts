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

  test('emotion followup popup can send the user back to the origin exercise screen', async ({ page }) => {
    await seedGuestSession(page);
    await page.goto('/exercice/emotions/joy/intime/aimant?from=tolerance');

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Roue des émotions' })).toBeVisible();
    await page.getByRole('button', { name: 'Reprendre mes exercices' }).click();

    await page.waitForURL('**/tolerance');
    await expect(page.getByRole('heading', { name: 'Fenêtre de tolérance' })).toBeVisible();
  });

  test('emotion followup gradient can redirect toward the matching activation zone', async ({ page }) => {
    await seedGuestSession(page);
    await page.goto('/exercice/emotions/fear/anxieux/preoccupe?from=hyper');

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Réactualiser mon niveau d’activation' }).click();
    await page.getByLabel('Niveau d’activation').fill('10');
    await page.getByRole('button', { name: 'Valider mon niveau d’activation' }).click();

    await expect(page.getByRole('button', { name: 'Continuer vers les exercices correspondants' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuer vers les exercices correspondants' }).click();

    await page.waitForURL('**/hypoactivation');
    await expect(page.getByRole('heading', { name: 'Exercices hypoactivation' })).toBeVisible();
  });

  test('emotion wheel keeps the level-2 parent when choosing the final emotion from the full flow', async ({ page }) => {
    await seedGuestSession(page);
    await page.goto('/exercice/emotions/fear?from=hyper');

    await page.locator('svg [role="link"]').nth(4).click();
    await page.waitForURL('**/exercice/emotions/fear/anxieux?from=hyper');

    await page.locator('svg [role="link"]').first().click();
    await expect(page).toHaveURL(/\/exercice\/emotions\/fear\/anxieux\/[^/?]+(?:\?from=hyper)?$/);
    const parts = new URL(page.url()).pathname.split('/').filter(Boolean);
    expect(parts.slice(-3)).toEqual(['fear', 'anxieux', parts.at(-1) as string]);
    await expect(page.getByRole('dialog')).toBeVisible();
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

  test('guest can build a safe place and read every saved answer', async ({ page }) => {
    await seedGuestSession(page);
    await page.goto('/exercice/safe-place/build');

    await expect(page.getByRole('heading', { name: 'Construction de mon lieu sûr' })).toBeVisible();
    const answers = page.getByPlaceholder('Écris ta réponse ici…');
    await expect(answers).toHaveCount(9);
    await answers.nth(0).fill('Une plage calme au coucher du soleil');
    await answers.nth(7).fill('Mon refuge');
    await page.getByRole('button', { name: 'Enregistrer mon lieu sûr' }).click();

    await page.waitForURL('**/exercice/safe-place/visit?highlight=*');
    await expect(page.getByRole('heading', { name: 'Accès à mon lieu sûr' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mon refuge' })).toBeVisible();
    await page.getByRole('button', { name: 'Voir le détail' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Une plage calme au coucher du soleil')).toBeVisible();
    await expect(page.getByText('Quel mot ou quelle expression pourrait représenter cet endroit sécurisant ?')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('paragraph').filter({ hasText: 'Mon refuge' })).toBeVisible();
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

  test('authenticated patient can revisit the landing page without a redirect loop', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();

    await page.getByRole('link', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/app$/);
  });

  test('activation buttons are restored after browser back navigation', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    await page.goto('/app');
    await page.getByRole('button', { name: 'Plus tard' }).click();

    await page.getByRole('button', { name: 'Hyperactivation' }).click();
    await expect(page).toHaveURL(/\/hyperactivation$/);
    await page.goBack();

    const hyperactivationButton = page.getByRole('button', { name: 'Hyperactivation' });
    await expect(page).toHaveURL(/\/app$/);
    await expect(hyperactivationButton).toBeEnabled();
    await hyperactivationButton.click();
    await expect(page).toHaveURL(/\/hyperactivation$/);
  });

  test('temporary session validation failure does not log out the patient', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    await page.unroute('**/api/auth/me');
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Service temporairement indisponible' }),
      });
    });

    await page.goto('/app');

    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('heading', { name: 'Comment te sens-tu maintenant ?' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('accountStatus'))).toBe('registered');
  });

  test('authenticated patient can logout from the logout popup with later', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    await page.goto('/app');

    await page.getByRole('button', { name: 'Plus tard' }).click();
    await page.getByRole('button', { name: 'Paramètres' }).click();
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await expect(page.getByText('Avant la déconnexion')).toBeVisible();
    await page.route('**/api/histories', async (route) => {
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

  test('authenticated patient must explicitly confirm account deletion', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    let deletionRequested = false;
    await page.route('**/api/auth/account', async (route) => {
      deletionRequested = route.request().method() === 'DELETE';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto('/app');

    await page.getByRole('button', { name: 'Plus tard' }).click();
    await page.getByRole('button', { name: 'Paramètres' }).click();
    await page.getByRole('button', { name: 'Supprimer mon compte' }).click();

    const deleteButton = page.getByRole('button', { name: 'Supprimer définitivement' });
    await expect(deleteButton).toBeDisabled();
    await page.getByLabel(/Saisis SUPPRIMER/).fill('SUPPRIMER');
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    await page.waitForURL(/\/$/);
    expect(deletionRequested).toBe(true);
  });

  test('authenticated patient can download a JSON account export', async ({ page }) => {
    await seedAuthenticatedSession(page, 'PATIENT');
    await page.route('**/api/auth/account/export', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="kalymap-donnees-test.json"',
          'Access-Control-Expose-Headers': 'Content-Disposition',
        },
        body: JSON.stringify({ formatVersion: 1, account: { role: 'PATIENT' } }),
      });
    });
    await page.goto('/app');

    await page.getByRole('button', { name: 'Plus tard' }).click();
    await page.getByRole('button', { name: 'Paramètres' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter mes données' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('kalymap-donnees-test.json');
  });

  test('doctor account only sees the placeholder screen', async ({ page }) => {
    await seedAuthenticatedSession(page, 'DOCTOR');
    await page.goto('/app');

    await expect(page.getByRole('heading', { name: 'Espace médecin', exact: true })).toBeVisible();
    await expect(page.getByText('L’espace médecin est temporairement masqué avant le déploiement.')).toBeVisible();
    await expect(page.getByText('Dashboard medecin')).toHaveCount(0);
  });
});
