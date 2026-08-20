'use client';

import { buildApiUrl } from './api';
import { getSessionProfile, isPatientSession } from './session';
const LAST_HISTORY_ID_KEY = 'mawja-last-history-id';
const LOCAL_FAVORITE_KEYS_PREFIX = 'mawja-favorite-exercise-keys';
const FAVORITES_EVENT = 'mawja-favorites-changed';

export type HistoryState = 'HYPER' | 'TOLERANCE' | 'HYPO';
export type ActivityCategory =
  | 'EMOTION'
  | 'SAFE_PLACE'
  | 'AUDIO'
  | 'GROUNDING'
  | 'SBA'
  | 'BREATHING'
  | 'TOOL'
  | 'HELP';

export type PatientHistory = {
  id: number;
  time: string;
  state: HistoryState;
  patientId: number;
  createdAt: string;
};

export type PatientGoal = {
  id: number;
  text: string;
  patientId: number;
  createdAt: string;
};

export type PatientNote = {
  id: number;
  text: string;
  patientId: number;
  createdAt: string;
};

export type PatientFavorite = {
  id: number;
  patientId: number;
  exerciseId: number;
  createdAt: string;
  exercise: {
    id: number;
    title: string;
    description: string | null;
  };
};

type ActivityPayload = {
  category: ActivityCategory;
  subType: string;
  detail?: string;
  emotion?: string;
  historyId?: number | null;
};

type GoalPayload = {
  text: string;
};

type NotePayload = {
  text: string;
};

type FavoritePayload = {
  key: string;
  title: string;
  description?: string | null;
};

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

function extractNumericId(payload: any): number | null {
  const candidates = [
    payload?.id,
    payload?.historyId,
    payload?.data?.id,
    payload?.data?.historyId,
    payload?.history?.id,
    payload?.payload?.id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string' && /^\d+$/.test(candidate)) return Number(candidate);
  }

  return null;
}

export function getLastHistoryId() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LAST_HISTORY_ID_KEY);
  return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

export function setLastHistoryId(historyId: number | null) {
  if (typeof window === 'undefined') return;
  if (historyId == null) {
    window.localStorage.removeItem(LAST_HISTORY_ID_KEY);
    return;
  }
  window.localStorage.setItem(LAST_HISTORY_ID_KEY, String(historyId));
}

function emitFavoritesChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function getFavoriteEventName() {
  return FAVORITES_EVENT;
}

function getScopedFavoriteStorageKey() {
  const profile = getSessionProfile();
  const userScope =
    profile?.patientProfileId != null
      ? `patient-${profile.patientProfileId}`
      : profile?.id != null
        ? `user-${String(profile.id)}`
        : profile?.email
          ? `email-${profile.email.toLowerCase()}`
          : null;

  return userScope ? `${LOCAL_FAVORITE_KEYS_PREFIX}:${userScope}` : null;
}

export function getLocalFavoriteKeys() {
  if (typeof window === 'undefined') return [] as string[];
  const storageKey = getScopedFavoriteStorageKey();
  if (!storageKey) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function setLocalFavoriteKeys(keys: string[]) {
  if (typeof window === 'undefined') return;
  const storageKey = getScopedFavoriteStorageKey();
  if (!storageKey) return;
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(Array.from(new Set(keys)))
  );
  emitFavoritesChanged();
}

export function addLocalFavoriteKey(key: string) {
  if (!key) return;
  const keys = getLocalFavoriteKeys();
  if (keys.includes(key)) return;
  setLocalFavoriteKeys([...keys, key]);
}

export function removeLocalFavoriteKey(key: string) {
  if (!key) return;
  setLocalFavoriteKeys(getLocalFavoriteKeys().filter((entry) => entry !== key));
}

export async function postHistoryEntry(state: HistoryState) {
  if (!isPatientSession()) return null;

  const response = await fetch(buildApiUrl('/histories'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      time: new Date().toISOString(),
      state,
    }),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible d’enregistrer l’état.');
  }

  const historyId = extractNumericId(payload);
  if (historyId != null) {
    setLastHistoryId(historyId);
  }

  return payload;
}

export async function fetchPatientHistories(): Promise<PatientHistory[]> {
  if (!isPatientSession()) return [];

  const response = await fetch(buildApiUrl('/histories/me'), {
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de récupérer l’historique.');
  }

  return Array.isArray(payload) ? (payload as PatientHistory[]) : [];
}

export async function fetchPatientGoals(): Promise<PatientGoal[]> {
  if (!isPatientSession()) return [];

  const response = await fetch(buildApiUrl('/goals/me'), {
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de récupérer les objectifs.');
  }

  return Array.isArray(payload) ? (payload as PatientGoal[]) : [];
}

export async function createPatientGoal(goal: GoalPayload): Promise<PatientGoal> {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour enregistrer un objectif.');
  }

  const response = await fetch(buildApiUrl('/goals'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de créer l’objectif.');
  }

  return payload as PatientGoal;
}

export async function updatePatientGoal(goalId: number, goal: GoalPayload): Promise<PatientGoal> {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour modifier un objectif.');
  }

  const response = await fetch(buildApiUrl(`/goals/${goalId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de modifier l’objectif.');
  }

  return payload as PatientGoal;
}

export async function deletePatientGoal(goalId: number) {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour supprimer un objectif.');
  }

  const response = await fetch(buildApiUrl(`/goals/${goalId}`), {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de supprimer l’objectif.');
  }

  return payload;
}

export async function fetchPatientNotes(): Promise<PatientNote[]> {
  if (!isPatientSession()) return [];

  const response = await fetch(buildApiUrl('/notes/me'), {
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de récupérer les notes.');
  }

  return Array.isArray(payload) ? (payload as PatientNote[]) : [];
}

export async function createPatientNote(note: NotePayload): Promise<PatientNote> {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour enregistrer une note.');
  }

  const response = await fetch(buildApiUrl('/notes'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de créer la note.');
  }

  return payload as PatientNote;
}

export async function updatePatientNote(noteId: number, note: NotePayload): Promise<PatientNote> {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour modifier une note.');
  }

  const response = await fetch(buildApiUrl(`/notes/${noteId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de modifier la note.');
  }

  return payload as PatientNote;
}

export async function deletePatientNote(noteId: number) {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour supprimer une note.');
  }

  const response = await fetch(buildApiUrl(`/notes/${noteId}`), {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de supprimer la note.');
  }

  return payload;
}

export async function fetchPatientFavorites(): Promise<PatientFavorite[]> {
  if (!isPatientSession()) return [];

  const response = await fetch(buildApiUrl('/favorites/me'), {
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de récupérer les favoris.');
  }

  return Array.isArray(payload) ? (payload as PatientFavorite[]) : [];
}

export async function createPatientFavorite(favorite: FavoritePayload): Promise<PatientFavorite> {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour enregistrer un favori.');
  }

  const response = await fetch(buildApiUrl('/favorites'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(favorite),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible d’ajouter ce favori.');
  }

  return payload as PatientFavorite;
}

export async function deletePatientFavorite(favoriteId: number) {
  if (!isPatientSession()) {
    throw new Error('Connecte-toi pour supprimer un favori.');
  }

  const response = await fetch(buildApiUrl(`/favorites/${favoriteId}`), {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de supprimer ce favori.');
  }

  return payload;
}

async function resolveLatestHistoryId() {
  if (!isPatientSession()) return null;

  const storedHistoryId = getLastHistoryId();
  if (storedHistoryId != null) return storedHistoryId;

  const histories = await fetchPatientHistories();
  const latestHistoryId = histories[0]?.id ?? null;
  if (latestHistoryId != null) {
    setLastHistoryId(latestHistoryId);
  }

  return latestHistoryId;
}

export async function logActivity(activity: ActivityPayload) {
  if (!isPatientSession()) return null;

  const historyId = activity.historyId ?? (await resolveLatestHistoryId());
  if (historyId == null) {
    throw new Error('Aucun historique récent disponible pour lier l’activité.');
  }

  const response = await fetch(buildApiUrl('/activities'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category: activity.category,
      subType: activity.subType,
      detail: activity.detail,
      emotion: activity.emotion,
      historyId,
    }),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible d’enregistrer l’activité.');
  }

  return payload;
}
