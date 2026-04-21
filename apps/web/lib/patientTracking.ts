'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://mawja-back.onrender.com/api';
const LAST_HISTORY_ID_KEY = 'mawja-last-history-id';

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

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('authToken');
}

function requireAuthToken() {
  const token = getAuthToken();
  if (!token) throw new Error('Token utilisateur introuvable.');
  return token;
}

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

export async function postHistoryEntry(state: HistoryState) {
  const response = await fetch(`${API_URL}/histories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireAuthToken()}`,
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
  const response = await fetch(`${API_URL}/histories/me`, {
    headers: {
      Authorization: `Bearer ${requireAuthToken()}`,
    },
    cache: 'no-store',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de récupérer l’historique.');
  }

  return Array.isArray(payload) ? (payload as PatientHistory[]) : [];
}

export async function fetchPatientGoals(): Promise<PatientGoal[]> {
  const response = await fetch(`${API_URL}/goals/me`, {
    headers: {
      Authorization: `Bearer ${requireAuthToken()}`,
    },
    cache: 'no-store',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de récupérer les objectifs.');
  }

  return Array.isArray(payload) ? (payload as PatientGoal[]) : [];
}

export async function createPatientGoal(goal: GoalPayload): Promise<PatientGoal> {
  const response = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireAuthToken()}`,
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
  const response = await fetch(`${API_URL}/goals/${goalId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireAuthToken()}`,
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
  const response = await fetch(`${API_URL}/goals/${goalId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${requireAuthToken()}`,
    },
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de supprimer l’objectif.');
  }

  return payload;
}

export async function fetchPatientNotes(): Promise<PatientNote[]> {
  const response = await fetch(`${API_URL}/notes/me`, {
    headers: {
      Authorization: `Bearer ${requireAuthToken()}`,
    },
    cache: 'no-store',
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de récupérer les notes.');
  }

  return Array.isArray(payload) ? (payload as PatientNote[]) : [];
}

export async function createPatientNote(note: NotePayload): Promise<PatientNote> {
  const response = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireAuthToken()}`,
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
  const response = await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireAuthToken()}`,
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
  const response = await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${requireAuthToken()}`,
    },
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || 'Impossible de supprimer la note.');
  }

  return payload;
}

async function resolveLatestHistoryId() {
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
  const historyId = activity.historyId ?? (await resolveLatestHistoryId());
  if (historyId == null) {
    throw new Error('Aucun historique récent disponible pour lier l’activité.');
  }

  const response = await fetch(`${API_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireAuthToken()}`,
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
