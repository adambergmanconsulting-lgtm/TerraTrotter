import { describe, expect, it } from 'vitest'
import { emptyProgress, mergeResult, progressFromStored } from './progress'
import { applyAnswer, emptyScore, type AnswerPace } from './scoring'

const pace: AnswerPace = { difficulty: 'medium', secondsUsed: 25, speedLimit: 25 }

describe('mergeResult', () => {
  it('keeps the better score and marks the continent complete', () => {
    const low = applyAnswer(emptyScore(), true, pace)
    const high = applyAnswer(applyAnswer(emptyScore(), true, pace), true, pace)
    const first = mergeResult(emptyProgress(), 'Europe', low, 'medium')
    const second = mergeResult(first, 'Europe', high, 'medium')
    expect(second.levels.medium.Europe.completed).toBe(true)
    expect(second.levels.medium.Europe.bestScore).toBe(high.score)
    expect(second.bestStreak).toBe(2)
    const weaker = mergeResult(second, 'Europe', low, 'medium')
    expect(weaker.levels.medium.Europe.bestScore).toBe(high.score)
  })

  it('keeps the time of the best score, and the faster time on a tie', () => {
    const slow = { ...applyAnswer(applyAnswer(emptyScore(), true, pace), true, pace), seconds: 140 }
    const fastTie = { ...slow, seconds: 90 }
    const higher = { ...applyAnswer(slow, true, pace), seconds: 200 }
    const saved = mergeResult(mergeResult(emptyProgress(), 'Europe', slow, 'medium'), 'Europe', fastTie, 'medium')
    expect(saved.levels.medium.Europe.bestSeconds).toBe(90)
    const beaten = mergeResult(saved, 'Europe', higher, 'medium')
    expect(beaten.levels.medium.Europe.bestScore).toBe(higher.score)
    expect(beaten.levels.medium.Europe.bestSeconds).toBe(200)
    const later = mergeResult(beaten, 'Europe', slow, 'medium')
    expect(later.levels.medium.Europe.bestSeconds).toBe(200)
  })

  it('stores each difficulty on its own board', () => {
    const score = applyAnswer(emptyScore(), true, pace)
    const next = mergeResult(mergeResult(emptyProgress(), 'Europe', score, 'easy'), 'Europe', score, 'hard')
    expect(next.levels.easy.Europe.bestScore).toBe(score.score)
    expect(next.levels.hard.Europe.bestScore).toBe(score.score)
    expect(next.levels.medium.Europe).toBeUndefined()
  })
})

describe('progressFromStored', () => {
  it('keeps an older continent board as medium', () => {
    const loaded = progressFromStored({
      bestStreak: 9,
      continents: { Americas: { completed: true, bestScore: 1840, bestAccuracy: 0.75, bestStreak: 9 } },
    })
    expect(loaded.levels.medium.Americas.bestScore).toBe(3680)
    expect(loaded.levels.easy).toEqual({})
    expect(loaded.bestStreak).toBe(9)
    expect(loaded.levels.medium.Americas.bestSeconds).toBeUndefined()
  })

  it('does not scale a score that is already on the shared scale', () => {
    const loaded = progressFromStored({
      scoring: 'weighted',
      bestStreak: 9,
      levels: { medium: { Americas: { completed: true, bestScore: 1840, bestAccuracy: 0.75, bestStreak: 9 } } },
    })
    expect(loaded.levels.medium.Americas.bestScore).toBe(1840)
  })
})
