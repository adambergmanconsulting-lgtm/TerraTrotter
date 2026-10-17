import { DIFFICULTY_WEIGHT, type Difficulty } from './difficulty'
import { accuracyOf, type ScoreState } from './scoring'

export interface ContinentRecord {
  completed: boolean
  bestScore: number
  bestAccuracy: number
  bestStreak: number
  bestSeconds?: number
}

export interface ProgressFile {
  levels: Record<Difficulty, Record<string, ContinentRecord>>
  bestStreak: number
  scoring: 'weighted'
}

export const PROGRESS_KEY = 'terratrotter.progress.v1'

export const emptyProgress = (): ProgressFile => ({
  levels: { easy: {}, medium: {}, hard: {} },
  bestStreak: 0,
  scoring: 'weighted',
})

export function mergeResult(prev: ProgressFile, continent: string, score: ScoreState, difficulty: Difficulty): ProgressFile {
  const accuracy = accuracyOf(score)
  const board = prev.levels[difficulty]
  const prior = board[continent]
  const next: ContinentRecord = {
    completed: true,
    bestScore: Math.max(prior?.bestScore ?? 0, score.score),
    bestAccuracy: Math.max(prior?.bestAccuracy ?? 0, accuracy),
    bestStreak: Math.max(prior?.bestStreak ?? 0, score.bestStreak),
    bestSeconds: timeOfBest(prior, score),
  }
  return {
    scoring: 'weighted',
    bestStreak: Math.max(prev.bestStreak, score.bestStreak),
    levels: { ...prev.levels, [difficulty]: { ...board, [continent]: next } },
  }
}

function timeOfBest(prior: ContinentRecord | undefined, score: ScoreState): number | undefined {
  if (!prior || score.score > prior.bestScore) return score.seconds
  if (score.score < prior.bestScore) return prior.bestSeconds
  if (prior.bestSeconds == null) return score.seconds
  return Math.min(prior.bestSeconds, score.seconds)
}

interface StoredProgress {
  levels?: Partial<Record<Difficulty, Record<string, ContinentRecord>>>
  continents?: Record<string, ContinentRecord>
  bestStreak?: number
  scoring?: string
}

function scaleBoard(
  difficulty: Difficulty,
  board: Record<string, ContinentRecord>,
  alreadyWeighted: boolean,
): Record<string, ContinentRecord> {
  if (alreadyWeighted) return board
  const weight = DIFFICULTY_WEIGHT[difficulty]
  return Object.fromEntries(
    Object.entries(board).map(([continent, record]) => [continent, { ...record, bestScore: Math.round(record.bestScore * weight) }]),
  )
}

export function progressFromStored(raw: unknown): ProgressFile {
  if (!raw || typeof raw !== 'object') return emptyProgress()
  const value = raw as StoredProgress
  const bestStreak = typeof value.bestStreak === 'number' ? value.bestStreak : 0
  const alreadyWeighted = value.scoring === 'weighted'
  if (value.levels && typeof value.levels === 'object') {
    return {
      scoring: 'weighted',
      bestStreak,
      levels: {
        easy: scaleBoard('easy', value.levels.easy ?? {}, alreadyWeighted),
        medium: scaleBoard('medium', value.levels.medium ?? {}, alreadyWeighted),
        hard: scaleBoard('hard', value.levels.hard ?? {}, alreadyWeighted),
      },
    }
  }
  if (value.continents && typeof value.continents === 'object') {
    return {
      scoring: 'weighted',
      bestStreak,
      levels: { easy: {}, medium: scaleBoard('medium', value.continents, alreadyWeighted), hard: {} },
    }
  }
  return emptyProgress()
}

export function loadProgress(): ProgressFile {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return emptyProgress()
    return progressFromStored(JSON.parse(raw))
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: ProgressFile): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}
