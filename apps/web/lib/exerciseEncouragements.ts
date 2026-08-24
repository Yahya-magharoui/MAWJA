export const EXERCISE_ENCOURAGEMENTS = [
  'Très bon travail !',
  'Tu gères !',
  'Continue comme ça !',
  'Bravo, tu es génial !',
  'Félicitations !',
  'Bravo à toi !',
] as const;

export function getRandomExerciseEncouragement() {
  const index = Math.floor(Math.random() * EXERCISE_ENCOURAGEMENTS.length);
  return EXERCISE_ENCOURAGEMENTS[index];
}
