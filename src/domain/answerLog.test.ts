import { describe, expect, it } from 'vitest'
import { emptyAnswerLog, kindWeight, recordAnswer } from './answerLog'

describe('answer log', () => {
  it('remembers misses and asks that kind less often', () => {
    let log = emptyAnswerLog()
    for (let i = 0; i < 4; i += 1) log = recordAnswer(log, 'borders', false)
    expect(log.kinds.borders).toEqual({ asked: 4, correct: 0 })
    expect(kindWeight(log, 'borders')).toBeLessThan(kindWeight(log, 'flag'))
  })

  it('keeps a normal rate until there is enough evidence', () => {
    const log = recordAnswer(emptyAnswerLog(), 'borders', false)
    expect(kindWeight(log, 'borders')).toBe(1)
  })
})
