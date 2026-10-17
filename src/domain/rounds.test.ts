import { describe, expect, it } from 'vitest'
import { emptyAnswerLog, recordAnswer } from './answerLog'
import { mulberry32 } from './random'
import { samplePinpoint } from './rounds'
import type { Country } from '../types/country'

function place(cca3: string, area: number): Country {
  return { cca3, area } as Country
}

describe('samplePinpoint', () => {
  it('keeps small countries on hard after repeated map misses', () => {
    let log = emptyAnswerLog()
    for (let i = 0; i < 4; i += 1) log = recordAnswer(log, 'pinpoint', false)
    const countries = [
      place('S1', 5_000),
      ...['L1', 'L2', 'L3', 'L4', 'L5'].map((code) => place(code, 300_000)),
    ]
    const medium = samplePinpoint(countries, mulberry32(1), log, 'medium')
    const hard = samplePinpoint(countries, mulberry32(1), log, 'hard')
    expect(medium.every((country) => country.area >= 200_000)).toBe(true)
    expect(hard.some((country) => country.cca3 === 'S1')).toBe(true)
  })
})
