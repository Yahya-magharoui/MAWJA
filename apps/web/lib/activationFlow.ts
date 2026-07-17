import type { HistoryState } from './patientTracking';

export type ActivationOrigin =
  | 'hypoactivation'
  | 'tolerance'
  | 'hyperactivation';

const HYPO_MAX = 34;
const TOLERANCE_MAX = 65;

export function parseActivationOrigin(value: string | null | undefined): ActivationOrigin | null {
  if (!value) return null;

  if (value === 'hypo' || value === 'hypoactivation') return 'hypoactivation';
  if (value === 'hyper' || value === 'hyperactivation') return 'hyperactivation';
  if (value === 'tolerance') return 'tolerance';

  return null;
}

export function activationOriginToRoute(origin: ActivationOrigin): string {
  if (origin === 'hypoactivation') return '/hypoactivation';
  if (origin === 'hyperactivation') return '/hyperactivation';
  return '/tolerance';
}

export function getExercisesFallbackRoute(origin: ActivationOrigin | null): string {
  if (!origin) return '/app';
  return activationOriginToRoute(origin);
}

export function classifyActivationValue(value: number): HistoryState {
  if (value <= HYPO_MAX) return 'HYPO';
  if (value > TOLERANCE_MAX) return 'HYPER';
  return 'TOLERANCE';
}

export function activationStateToRoute(state: HistoryState): string {
  if (state === 'HYPO') return '/hypoactivation';
  if (state === 'HYPER') return '/hyperactivation';
  return '/tolerance';
}

export function activationValueToRoute(value: number): string {
  return activationStateToRoute(classifyActivationValue(value));
}
