import { DIFFICULTY_WEIGHT, type Difficulty } from './difficulty'

export interface ScoreState {
  score: number
  streak: number
  bestStreak: number
  correct: number
  answered: number
  seconds: number
}

export interface AnswerPace {
  difficulty: Difficulty
  secondsUsed: number
  speedLimit: number
}

export const emptyScore = (): ScoreState => ({
  score: 0,
  streak: 0,
  bestStreak: 0,
  correct: 0,
  answered: 0,
  seconds: 0,
})

/** Points for one correct answer: base streak points, times difficulty, times up to 2 for using none of the clock. */
export function pointsForAnswer(streak: number, pace: AnswerPace): number {
  const base = 100 + (streak - 1) * 20
  const weight = DIFFICULTY_WEIGHT[pace.difficulty]
  const room = pace.speedLimit > 0 ? (pace.speedLimit - pace.secondsUsed) / pace.speedLimit : 0
  const speed = Math.min(1, Math.max(0, room))
  return Math.round(base * weight * (1 + speed))
}

export function applyAnswer(state: ScoreState, correct: boolean, pace: AnswerPace): ScoreState {
  const streak = correct ? state.streak + 1 : 0
  const gained = correct ? pointsForAnswer(streak, pace) : 0
  return {
    score: state.score + gained,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    correct: state.correct + (correct ? 1 : 0),
    answered: state.answered + 1,
    seconds: state.seconds,
  }
}

/** Clock for a round, such as 3:12. */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export function accuracyOf(state: ScoreState): number {
  if (state.answered === 0) return 0
  return state.correct / state.answered
}
