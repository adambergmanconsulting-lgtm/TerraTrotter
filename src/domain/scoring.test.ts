import { describe, expect, it } from 'vitest'
import { applyAnswer, emptyScore } from './scoring'

describe('applyAnswer', () => {
  it('adds 100 for the first correct answer and grows the streak bonus', () => {
    const once = applyAnswer(emptyScore(), true)
    const twice = applyAnswer(once, true)
    expect(once).toMatchObject({ score: 100, streak: 1, correct: 1 })
    expect(twice).toMatchObject({ score: 220, streak: 2, bestStreak: 2 })
  })

  it('clears the streak after a miss and keeps the best streak', () => {
    const hot = applyAnswer(applyAnswer(emptyScore(), true), true)
    const missed = applyAnswer(hot, false)
    expect(missed.streak).toBe(0)
    expect(missed.bestStreak).toBe(2)
    expect(missed.score).toBe(hot.score)
    expect(missed.answered).toBe(3)
  })
})
