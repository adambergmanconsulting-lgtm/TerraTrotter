import { describe, expect, it } from 'vitest'
import { emptyProgress, mergeResult } from './progress'
import { applyAnswer, emptyScore } from './scoring'

describe('mergeResult', () => {
  it('keeps the better score and marks the continent complete', () => {
    const low = applyAnswer(emptyScore(), true)
    const high = applyAnswer(applyAnswer(emptyScore(), true), true)
    const first = mergeResult(emptyProgress(), 'Europe', low)
    const second = mergeResult(first, 'Europe', high)
    expect(second.continents.Europe.completed).toBe(true)
    expect(second.continents.Europe.bestScore).toBe(high.score)
    expect(second.bestStreak).toBe(2)
    const weaker = mergeResult(second, 'Europe', low)
    expect(weaker.continents.Europe.bestScore).toBe(high.score)
  })
})
