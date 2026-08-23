import type { Page } from '@playwright/test';

type SessionRole = 'PATIENT' | 'DOCTOR';

export async function seedAuthenticatedSession(page: Page, role: SessionRole, email?: string) {
  const accountEmail = email ?? (role === 'DOCTOR' ? 'doctor@example.com' : 'patient@example.com');
  const loggedInAt = new Date().toISOString();
  const userId = role === 'DOCTOR' ? 2 : 1;
  const authMePayload = {
    user: {
      id: userId,
      email: accountEmail,
      name: role === 'DOCTOR' ? 'Docteur Test' : 'Patient Test',
      role,
      patientProfileId: role === 'PATIENT' ? userId : null,
      doctorProfileId: role === 'DOCTOR' ? userId : null,
    },
  };

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authMePayload),
    });
  });

  await page.addInitScript(
    ({ seededEmail, seededRole, seededLoggedInAt, seededUserId }) => {
      if (window.localStorage.getItem('accountStatus') === 'registered') {
        return;
      }

      window.localStorage.setItem('accountStatus', 'registered');
      window.localStorage.setItem(
        'guestProfile',
        JSON.stringify({
          id: seededUserId,
          email: seededEmail,
          role: seededRole,
          accessMode: 'authenticated',
          loggedInAt: seededLoggedInAt,
        })
      );
      window.localStorage.removeItem('mawja-state-checkin-last-at');
      window.localStorage.removeItem('mawja-state-checkin-login-prompted-at');
    },
    {
      seededEmail: accountEmail,
      seededRole: role,
      seededLoggedInAt: loggedInAt,
      seededUserId: userId,
    }
  );
}

export async function seedGuestSession(page: Page) {
  await page.addInitScript(() => {
    if (window.localStorage.getItem('accountStatus') === 'guest') {
      return;
    }

    const guestId = 'guest-e2e';
    window.localStorage.setItem('accountStatus', 'guest');
    window.localStorage.setItem('guestId', guestId);
    window.localStorage.setItem(
      'guestProfile',
      JSON.stringify({
        id: guestId,
        role: 'PATIENT',
        accessMode: 'guest',
      })
    );
    window.localStorage.removeItem('mawja-state-checkin-last-at');
    window.localStorage.removeItem('mawja-state-checkin-login-prompted-at');
  });
}
