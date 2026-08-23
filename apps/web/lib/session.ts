'use client';

import { useEffect, useState } from 'react';

export type AccountStatus = 'guest' | 'registered';
export type UserRole = 'PATIENT' | 'DOCTOR';
export type AccessMode = 'guest' | 'authenticated';

export type SessionProfile = {
  id?: string | number;
  email?: string | null;
  name?: string | null;
  role?: UserRole | null;
  patientProfileId?: number | null;
  doctorProfileId?: number | null;
  createdAt?: string;
  loggedInAt?: string;
  accessMode?: AccessMode;
};

const SESSION_PROFILE_KEY = 'guestProfile';
const LEGACY_AUTH_TOKEN_KEY = 'kalymapAuthToken';
const SESSION_EVENT = 'mawja-session-changed';

function removeLegacyAuthToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
}

function normalizeRole(value: unknown): UserRole | null {
  return value === 'DOCTOR' || value === 'PATIENT' ? value : null;
}

export function getAccountStatus(): AccountStatus {
  if (typeof window === 'undefined') return 'guest';
  removeLegacyAuthToken();
  return window.localStorage.getItem('accountStatus') === 'registered' ? 'registered' : 'guest';
}

export function getSessionProfile(): SessionProfile | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(SESSION_PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      id: typeof parsed.id === 'string' || typeof parsed.id === 'number' ? parsed.id : undefined,
      email: typeof parsed.email === 'string' ? parsed.email : null,
      name: typeof parsed.name === 'string' ? parsed.name : null,
      role: normalizeRole(parsed.role),
      patientProfileId: typeof parsed.patientProfileId === 'number' ? parsed.patientProfileId : null,
      doctorProfileId: typeof parsed.doctorProfileId === 'number' ? parsed.doctorProfileId : null,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : undefined,
      loggedInAt: typeof parsed.loggedInAt === 'string' ? parsed.loggedInAt : undefined,
      accessMode: parsed.accessMode === 'authenticated' ? 'authenticated' : 'guest',
    };
  } catch {
    return null;
  }
}

export function getUserRole(): UserRole | null {
  return getSessionProfile()?.role ?? null;
}

export function isAuthenticatedSession() {
  const profile = getSessionProfile();
  return getAccountStatus() === 'registered' && profile?.accessMode === 'authenticated';
}

export function isPatientSession() {
  return isAuthenticatedSession() && getUserRole() === 'PATIENT';
}

export function isDoctorSession() {
  return isAuthenticatedSession() && getUserRole() === 'DOCTOR';
}

export function persistAuthenticatedSession(profile: SessionProfile) {
  if (typeof window === 'undefined') return;

  removeLegacyAuthToken();
  window.localStorage.setItem('accountStatus', 'registered');
  window.localStorage.setItem(
    SESSION_PROFILE_KEY,
    JSON.stringify({
      ...profile,
      id: profile.id,
      email: profile.email ?? null,
      role: normalizeRole(profile.role) ?? null,
      accessMode: 'authenticated',
      loggedInAt: profile.loggedInAt ?? new Date().toISOString(),
    } satisfies SessionProfile)
  );
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function persistGuestSession(profile?: Partial<SessionProfile>) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem('accountStatus', 'guest');
  window.localStorage.setItem(
    SESSION_PROFILE_KEY,
    JSON.stringify({
      ...profile,
      role: 'PATIENT',
      accessMode: 'guest',
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    } satisfies SessionProfile)
  );
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  removeLegacyAuthToken();
  window.localStorage.removeItem('accountStatus');
  window.localStorage.removeItem(SESSION_PROFILE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useAuthenticatedSession() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    return isAuthenticatedSession();
  });

  useEffect(() => {
    const sync = () => setAuthenticated(isAuthenticatedSession());
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);

    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, []);

  return authenticated;
}

export function useSessionInfo() {
  const [session, setSession] = useState<{
    status: AccountStatus;
    authenticated: boolean;
    role: UserRole | null;
    profile: SessionProfile | null;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    return {
      status: getAccountStatus(),
      authenticated: isAuthenticatedSession(),
      role: getUserRole(),
      profile: getSessionProfile(),
    };
  });

  useEffect(() => {
    const sync = () => {
      setSession({
        status: getAccountStatus(),
        authenticated: isAuthenticatedSession(),
        role: getUserRole(),
        profile: getSessionProfile(),
      });
    };

    sync();
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);

    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, []);

  return session;
}
