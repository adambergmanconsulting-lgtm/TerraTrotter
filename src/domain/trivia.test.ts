import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { emptyAnswerLog, recordAnswer } from './answerLog'
import { mulberry32 } from './random'
import { buildTriviaRound } from './trivia'
import type { Country } from '../types/country'

const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as Country[]
const europe = countries.filter((country) => country.continent === 'Europe')

describe('buildTriviaRound', () => {
  it('asks eight questions whose correct choice is on the card', () => {
    const round = buildTriviaRound(europe, mulberry32(7))
    expect(round).toHaveLength(8)
    for (const item of round) {
      expect(item.choices.some((choice) => choice.id === item.correctId)).toBe(true)
      expect(new Set(item.choices.map((choice) => choice.id)).size).toBe(item.choices.length)
    }
    const prompts = new Set(round.map((item) => item.prompt))
    expect(prompts.size).toBe(round.length)
  })

  it('gives both figures for a population comparison', () => {
    const round = buildTriviaRound(europe, mulberry32(7))
    const item = round.find((question) => question.id.startsWith('population-'))
    expect(item).toBeTruthy()
    const named = item!.prompt.match(/: (.+) or (.+)\?$/)
    expect(named).toBeTruthy()
    for (const name of [named![1], named![2]]) {
      const country = europe.find((entry) => entry.name.common === name)
      expect(country).toBeTruthy()
      expect(item!.explanation).toContain(`${name}: ${country!.population.toLocaleString('en-US')} people`)
    }
  })

  it('uses the stored border count as the correct neighbor answer', () => {
    const round = buildTriviaRound(europe, mulberry32(3))
    const border = round.find((item) => item.id.startsWith('borders-'))
    expect(border).toBeTruthy()
    const name = border!.prompt.replace('How many countries share a land border with ', '').replace('?', '')
    const country = europe.find((item) => item.name.common === name)
    expect(border!.correctId).toBe(String(country!.borders.length))
    expect(country!.borders.length).toBeLessThanOrEqual(2)
    for (const choice of border!.choices) {
      if (choice.id === border!.correctId) continue
      expect(Math.abs(Number(choice.id) - country!.borders.length)).toBeGreaterThanOrEqual(2)
    }
  })

  it('asks which country borders the target, not which one does not', () => {
    const round = buildTriviaRound(europe, mulberry32(3))
    const match = round.find((item) => item.kind === 'border-match')
    expect(match).toBeTruthy()
    const name = match!.prompt.replace('Which of these countries borders ', '').replace('?', '')
    const country = europe.find((item) => item.name.common === name)
    expect(country!.borders).toContain(match!.correctId)
    expect(country!.borders.length).toBeLessThanOrEqual(3)
  })

  it('drops a kind the player keeps missing', () => {
    let log = emptyAnswerLog()
    for (const kind of ['border-match', 'population', 'area', 'capital', 'flag', 'landlocked', 'subregion', 'currency']) {
      for (let i = 0; i < 4; i += 1) log = recordAnswer(log, kind, true)
    }
    for (let i = 0; i < 4; i += 1) log = recordAnswer(log, 'borders', false)
    const rounds = Array.from({ length: 30 }, (_, seed) => buildTriviaRound(europe, mulberry32(seed), log))
    const withBorders = rounds.filter((round) => round.some((item) => item.kind === 'borders')).length
    expect(withBorders).toBeLessThan(20)
  })
})
