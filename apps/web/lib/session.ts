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

function normalizeRole(value: unknown): UserRole | null {
  return value === 'DOCTOR' || value === 'PATIENT' ? value : null;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return window.atob(padded);
}

type JwtPayload = {
  sub?: string | number;
  email?: string;
  role?: UserRole;
};

function getJwtPayload(token?: string | null): JwtPayload | null {
  if (typeof window === 'undefined' || !token) return null;

  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const decoded = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
    return {
      sub: typeof decoded.sub === 'string' || typeof decoded.sub === 'number' ? decoded.sub : undefined,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      role: normalizeRole(decoded.role) ?? undefined,
    };
  } catch {
    return null;
  }
}

export function getAccountStatus(): AccountStatus {
  if (typeof window === 'undefined') return 'guest';
  return window.localStorage.getItem('accountStatus') === 'registered' ? 'registered' : 'guest';
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('authToken');
}

export function getSessionProfile(): SessionProfile | null {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  const jwtPayload = getJwtPayload(token);
  const raw = window.localStorage.getItem(SESSION_PROFILE_KEY);
  if (!raw) {
    return jwtPayload
      ? {
          id: jwtPayload.sub,
          email: jwtPayload.email ?? null,
          role: jwtPayload.role ?? null,
          accessMode: isAuthenticatedSession() ? 'authenticated' : 'guest',
        }
      : null;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      id: typeof parsed.id === 'string' || typeof parsed.id === 'number' ? parsed.id : jwtPayload?.sub,
      email: typeof parsed.email === 'string' ? parsed.email : jwtPayload?.email ?? null,
      name: typeof parsed.name === 'string' ? parsed.name : null,
      role: jwtPayload?.role ?? normalizeRole(parsed.role),
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
  return Boolean(getAuthToken()) && getAccountStatus() === 'registered';
}

export function isPatientSession() {
  return isAuthenticatedSession() && getUserRole() === 'PATIENT';
}

export function isDoctorSession() {
  return isAuthenticatedSession() && getUserRole() === 'DOCTOR';
}

export function persistAuthenticatedSession(profile: SessionProfile, token?: string | null) {
  if (typeof window === 'undefined') return;

  if (token) {
    window.localStorage.setItem('authToken', token);
  }

  const jwtPayload = getJwtPayload(token ?? getAuthToken());

  window.localStorage.setItem('accountStatus', 'registered');
  window.localStorage.setItem(
    SESSION_PROFILE_KEY,
    JSON.stringify({
      ...profile,
      id: profile.id ?? jwtPayload?.sub,
      email: profile.email ?? jwtPayload?.email ?? null,
      role: normalizeRole(profile.role) ?? jwtPayload?.role ?? null,
      accessMode: 'authenticated',
      loggedInAt: profile.loggedInAt ?? new Date().toISOString(),
    } satisfies SessionProfile)
  );
}

export function persistGuestSession(profile?: Partial<SessionProfile>) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('authToken');
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
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('authToken');
  window.localStorage.removeItem('accountStatus');
  window.localStorage.removeItem(SESSION_PROFILE_KEY);
}

export function useAuthenticatedSession() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthenticated(isAuthenticatedSession());
  }, []);

  return authenticated;
}

export function useSessionInfo() {
  const [session, setSession] = useState<{
    status: AccountStatus;
    authenticated: boolean;
    role: UserRole | null;
    profile: SessionProfile | null;
  } | null>(null);

  useEffect(() => {
    setSession({
      status: getAccountStatus(),
      authenticated: isAuthenticatedSession(),
      role: getUserRole(),
      profile: getSessionProfile(),
    });
  }, []);

  return session;
}
