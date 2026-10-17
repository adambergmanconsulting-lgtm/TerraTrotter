import { describe, expect, it } from 'vitest'
import { applyAnswer, emptyScore, formatClock, type AnswerPace } from './scoring'

const instant = (difficulty: AnswerPace['difficulty'], speedLimit: number): AnswerPace => ({
  difficulty,
  secondsUsed: 0,
  speedLimit,
})

const spent = (difficulty: AnswerPace['difficulty'], speedLimit: number): AnswerPace => ({
  difficulty,
  secondsUsed: speedLimit,
  speedLimit,
})

describe('applyAnswer', () => {
  it('adds the streak bonus when the clock is used up', () => {
    const pace = spent('easy', 25)
    const once = applyAnswer(emptyScore(), true, pace)
    const twice = applyAnswer(once, true, pace)
    expect(once).toMatchObject({ score: 100, streak: 1, correct: 1 })
    expect(twice).toMatchObject({ score: 220, streak: 2, bestStreak: 2 })
  })

  it('scores a fast Hard answer above Medium and Easy, and above a slow Hard answer', () => {
    const easy = applyAnswer(emptyScore(), true, instant('easy', 25)).score
    const medium = applyAnswer(emptyScore(), true, instant('medium', 25)).score
    const hard = applyAnswer(emptyScore(), true, instant('hard', 15)).score
    const hardSlow = applyAnswer(emptyScore(), true, spent('hard', 15)).score
    expect(easy).toBe(200)
    expect(medium).toBe(400)
    expect(hard).toBe(600)
    expect(hardSlow).toBe(300)
    expect(hardSlow).toBeGreaterThan(easy)
  })

  it('clears the streak after a miss and keeps the best streak', () => {
    const pace = spent('easy', 25)
    const hot = applyAnswer(applyAnswer(emptyScore(), true, pace), true, pace)
    const missed = applyAnswer(hot, false, pace)
    expect(missed.streak).toBe(0)
    expect(missed.bestStreak).toBe(2)
    expect(missed.score).toBe(hot.score)
    expect(missed.answered).toBe(3)
  })

  it('formats the round clock in minutes and seconds', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(9)).toBe('0:09')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(600)).toBe('10:00')
  })
})
