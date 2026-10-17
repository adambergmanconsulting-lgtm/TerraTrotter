export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function roundLimits(difficulty: Difficulty): { pin: number; trivia: number } {
  if (difficulty === 'easy') return { pin: 0, trivia: 0 }
  if (difficulty === 'hard') return { pin: 15, trivia: 12 }
  return { pin: 25, trivia: 20 }
}

/** Shared point scale. Hard is worth three times Easy before speed. */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
}

export function showMapFlag(difficulty: Difficulty): boolean {
  return difficulty !== 'hard'
}

export function difficultyNote(difficulty: Difficulty): string {
  const limits = roundLimits(difficulty)
  const hint = showMapFlag(difficulty)
    ? 'The map shows the country name and its flag.'
    : 'The map shows the country name only.'
  const clock =
    limits.pin === 0
      ? 'There is no time limit.'
      : `You have ${limits.pin} seconds on the map and ${limits.trivia} seconds on each trivia question.`
  const reach = difficulty === 'hard' ? ' Small countries stay in.' : ''
  return `${hint} ${clock} Correct answers score at ${DIFFICULTY_WEIGHT[difficulty]}×, and a faster answer scores up to twice that.${reach}`
}
