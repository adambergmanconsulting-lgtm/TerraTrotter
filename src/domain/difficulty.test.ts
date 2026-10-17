import { describe, expect, it } from 'vitest'
import { difficultyNote, roundLimits, showMapFlag } from './difficulty'

describe('difficulty', () => {
  it('drops the clock on easy and shortens it on hard', () => {
    expect(roundLimits('easy')).toEqual({ pin: 0, trivia: 0 })
    expect(roundLimits('medium')).toEqual({ pin: 25, trivia: 20 })
    expect(roundLimits('hard')).toEqual({ pin: 15, trivia: 12 })
  })

  it('shows the flag on easy and medium only', () => {
    expect(showMapFlag('easy')).toBe(true)
    expect(showMapFlag('medium')).toBe(true)
    expect(showMapFlag('hard')).toBe(false)
  })

  it('explains the selected level', () => {
    expect(difficultyNote('easy')).toBe(
      'The map shows the country name and its flag. There is no time limit. Correct answers score at 1×, and a faster answer scores up to twice that.',
    )
    expect(difficultyNote('medium')).toBe(
      'The map shows the country name and its flag. You have 25 seconds on the map and 20 seconds on each trivia question. Correct answers score at 2×, and a faster answer scores up to twice that.',
    )
    expect(difficultyNote('hard')).toBe(
      'The map shows the country name only. You have 15 seconds on the map and 12 seconds on each trivia question. Correct answers score at 3×, and a faster answer scores up to twice that. Small countries stay in.',
    )
  })
})
