export interface ScoreState {
  score: number
  streak: number
  bestStreak: number
  correct: number
  answered: number
}

export const emptyScore = (): ScoreState => ({
  score: 0,
  streak: 0,
  bestStreak: 0,
  correct: 0,
  answered: 0,
})

export function applyAnswer(state: ScoreState, correct: boolean): ScoreState {
  const streak = correct ? state.streak + 1 : 0
  const gained = correct ? 100 + (streak - 1) * 20 : 0
  return {
    score: state.score + gained,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    correct: state.correct + (correct ? 1 : 0),
    answered: state.answered + 1,
  }
}

export function accuracyOf(state: ScoreState): number {
  if (state.answered === 0) return 0
  return state.correct / state.answered
}
