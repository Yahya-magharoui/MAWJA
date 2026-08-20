export type ExerciseCard = {
  key: string;
  label: string;
  href: string;
  icon?: string;
};

export const HYPER_EXERCISES: ExerciseCard[] = [
  { key: 'emotions', label: 'Roue des émotions', href: '/exercice/emotions', icon: '/icons/emotion.svg' },
  { key: 'safeplace', label: 'Sécurisation (lieu sûr)', href: '/exercice/safe-place', icon: '/icons/lieusur.png' },
  { key: 'mindful', label: 'Audios pleine conscience', href: '/exercice/mindful', icon: '/icons/audio.svg' },
  { key: 'anchoring', label: 'Ancrage sensoriel', href: '/exercice/anchoring', icon: '/icons/ancrage.svg' },
  { key: 'sba', label: 'SBA lentes', href: '/exercice/sba', icon: '/icons/sba.png' },
  { key: 'coherence', label: 'Exercices de respiration', href: '/exercice/breathing', icon: '/icons/breathing.svg' },
  { key: 'trousse', label: 'Trousse de sécurité émotionnelle', href: '/exercice/trousse', icon: '/icons/trousse.png' },
  { key: 'plan', label: 'Mon plan de crise', href: '/plan', icon: '/icons/plan.svg' },
];

export const HYPO_EXERCISES: ExerciseCard[] = [
  { key: 'emotions', label: 'Roue des émotions', href: '/exercice/emotions', icon: '/icons/emotion.svg' },
  { key: 'stim-breath', label: 'Respiration stimulante', href: '/exercice/respiration-boost', icon: '/icons/stimulante.svg' },
  { key: 'audios', label: 'Audios rythmés', href: '/exercice/mindful?mode=rythme', icon: '/icons/audio.svg' },
  { key: 'anchoring', label: 'Ancrage sensoriel', href: '/exercice/anchoring', icon: '/icons/ancrage.svg' },
  { key: 'sba-fast', label: 'SBA rapides', href: '/exercice/sba?mode=fast', icon: '/icons/sba.png' },
  { key: 'wake-body', label: 'Exercices pour réveiller le corps', href: '/exercice/wake-body', icon: '/icons/corps.svg' },
  { key: 'plan', label: 'Mon plan de crise', href: '/plan', icon: '/icons/plan.svg' },
];

export const ROUTINE_EXERCISES: ExerciseCard[] = [
  { key: 'toolkit', label: 'Boîte à outils', href: '/toolkit' },
  { key: 'safe', label: 'Sécurisation (lieu sûr)', href: '/exercice/safe-place' },
  { key: 'mindful-rhythm', label: 'Audios rythmés', href: '/exercice/mindful?mode=rythme' },
  { key: 'anchor', label: 'Ancrage sensoriel', href: '/exercice/anchoring' },
];

export const EXERCISE_CATALOG: ExerciseCard[] = [
  ...HYPER_EXERCISES,
  ...HYPO_EXERCISES,
  ...ROUTINE_EXERCISES,
].filter(
  (card, index, array) => array.findIndex((entry) => entry.key === card.key) === index
);

export function findExerciseCardByKey(key: string) {
  return EXERCISE_CATALOG.find((card) => card.key === key) ?? null;
}

export function findExerciseCardByLabel(label: string) {
  return EXERCISE_CATALOG.find((card) => card.label === label) ?? null;
}
