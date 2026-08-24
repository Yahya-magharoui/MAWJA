'use client';

import { buildApiUrl } from './api';
import { isPatientSession } from './session';

export const SAFE_PLACE_QUESTIONS = [
  'Pense à un lieu réel ou imaginaire où tu as été et où tu t’es senti en sécurité.',
  'Est-ce qu’une image pourrait représenter cet endroit ?',
  'Essaie de décrire ce que tu vois. Note ce que tu entends, ce que tu ressens, ce que tu penses dans cet endroit sécurisant.',
  'Concentre-toi sur tout cela et essaie de situer où tu ressens cela dans ton corps.',
  'Est-ce qu’un mot ou une expression pourrait représenter cet endroit sécurisant ?',
  'Pense à ce mot ou à cette expression et note les sensations que tu ressens quand tu y penses.',
  'Maintenant, tu peux effectuer cet exercice aussi souvent que nécessaire.',
] as const;

export type SafePlaceAnswer = { question: string; answer: string };
export type SafePlace = {
  id: string | number;
  name: string;
  answers: SafePlaceAnswer[];
  createdAt: string | number;
  patientId?: number;
};
export type SafePlaceInput = { name: string; answers: SafePlaceAnswer[] };

const STORAGE_KEY = 'safePlacesV1';

function normalizeAnswers(value: unknown): SafePlaceAnswer[] {
  if (!Array.isArray(value)) return [];
  if (value.every((entry) => typeof entry === 'string')) {
    const legacyAnswers = value as string[];
    if (legacyAnswers.length === 1) {
      return [{ question: SAFE_PLACE_QUESTIONS[4], answer: legacyAnswers[0] ?? '' }];
    }
    return legacyAnswers.map((answer, index) => ({
      question: SAFE_PLACE_QUESTIONS[index] ?? `Question ${index + 1}`,
      answer,
    }));
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.question !== 'string' || typeof candidate.answer !== 'string') return [];
    return [{ question: candidate.question, answer: candidate.answer }];
  });
}

function normalizeSafePlace(value: unknown): SafePlace | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' && typeof candidate.id !== 'number') return null;
  return {
    id: candidate.id,
    name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : 'Mon lieu sûr',
    answers: normalizeAnswers(candidate.answers),
    createdAt: typeof candidate.createdAt === 'string' || typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
    patientId: typeof candidate.patientId === 'number' ? candidate.patientId : undefined,
  };
}

function readLocalSafePlaces() {
  if (typeof window === 'undefined') return [] as SafePlace[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeSafePlace).filter((entry): entry is SafePlace => Boolean(entry)) : [];
  } catch {
    return [];
  }
}

function writeLocalSafePlaces(items: SafePlace[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function fetchSafePlaces(): Promise<SafePlace[]> {
  if (!isPatientSession()) return readLocalSafePlaces();
  const response = await fetch(buildApiUrl('/safe-places/me'), { credentials: 'include', cache: 'no-store' });
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(payload?.message || 'Impossible de récupérer tes lieux sûrs.');
  return Array.isArray(payload) ? payload.map(normalizeSafePlace).filter((entry): entry is SafePlace => Boolean(entry)) : [];
}

export async function createSafePlace(input: SafePlaceInput): Promise<SafePlace> {
  if (!isPatientSession()) {
    const item: SafePlace = { ...input, id: `local-${Date.now().toString(36)}`, createdAt: Date.now() };
    writeLocalSafePlaces([item, ...readLocalSafePlaces()]);
    return item;
  }

  const response = await fetch(buildApiUrl('/safe-places'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(payload?.message || 'Impossible d’enregistrer ton lieu sûr.');
  const item = normalizeSafePlace(payload);
  if (!item) throw new Error('La réponse du serveur est invalide.');
  return item;
}

export async function deleteSafePlace(id: string | number) {
  if (!isPatientSession()) {
    writeLocalSafePlaces(readLocalSafePlaces().filter((item) => String(item.id) !== String(id)));
    return;
  }
  const response = await fetch(buildApiUrl(`/safe-places/${id}`), { method: 'DELETE', credentials: 'include' });
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(payload?.message || 'Impossible de supprimer ce lieu sûr.');
}
