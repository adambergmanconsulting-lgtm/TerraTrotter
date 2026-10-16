import { accuracyOf, type ScoreState } from './scoring'

export interface ContinentRecord {
  completed: boolean
  bestScore: number
  bestAccuracy: number
  bestStreak: number
}

export interface ProgressFile {
  continents: Record<string, ContinentRecord>
  bestStreak: number
}

export const PROGRESS_KEY = 'terratrotter.progress.v1'

export const emptyProgress = (): ProgressFile => ({ continents: {}, bestStreak: 0 })

export function mergeResult(prev: ProgressFile, continent: string, score: ScoreState): ProgressFile {
  const accuracy = accuracyOf(score)
  const prior = prev.continents[continent]
  const next: ContinentRecord = {
    completed: true,
    bestScore: Math.max(prior?.bestScore ?? 0, score.score),
    bestAccuracy: Math.max(prior?.bestAccuracy ?? 0, accuracy),
    bestStreak: Math.max(prior?.bestStreak ?? 0, score.bestStreak),
  }
  return {
    bestStreak: Math.max(prev.bestStreak, score.bestStreak),
    continents: { ...prev.continents, [continent]: next },
  }
}

export function loadProgress(): ProgressFile {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as ProgressFile
    if (!parsed || typeof parsed !== 'object' || !parsed.continents) return emptyProgress()
    return { continents: parsed.continents, bestStreak: parsed.bestStreak ?? 0 }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: ProgressFile): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}
