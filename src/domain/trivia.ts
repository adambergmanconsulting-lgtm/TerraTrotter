import { kindWeight, type AnswerLog } from './answerLog'
import type { Country } from '../types/country'
import { sample, shuffle, type Rng } from './random'
import { TRIVIA_TARGET } from './rounds'

export interface Choice {
  id: string
  label: string
  flagCca2?: string
}

export type QuestionKind =
  | 'borders'
  | 'border-match'
  | 'population'
  | 'area'
  | 'capital'
  | 'flag'
  | 'landlocked'
  | 'subregion'
  | 'currency'

export interface TriviaQuestion {
  id: string
  kind: QuestionKind
  prompt: string
  choices: Choice[]
  correctId: string
  explanation: string
}

type Builder = (countries: readonly Country[], rng: Rng, index: number) => TriviaQuestion | null

function question(
  id: string,
  kind: QuestionKind,
  prompt: string,
  choices: Choice[],
  correctId: string,
  explanation: string,
  rng: Rng,
): TriviaQuestion {
  return { id, kind, prompt, choices: shuffle(choices, rng), correctId, explanation }
}

function others(countries: readonly Country[], country: Country): Country[] {
  return countries.filter((item) => item.cca3 !== country.cca3)
}

function familiar(pool: readonly Country[], rng: Rng): Country[] {
  const ranked = [...pool].sort((left, right) => right.population - left.population)
  const head = ranked.slice(0, Math.max(6, Math.ceil(ranked.length / 3)))
  return shuffle(head, rng)
}

function neighborNames(country: Country, byCode: Map<string, Country>): string[] {
  return country.borders
    .map((code) => byCode.get(code)?.name.common)
    .filter((name): name is string => Boolean(name))
}

function borderCount(countries: readonly Country[], rng: Rng, index: number): TriviaQuestion | null {
  const byCode = new Map(countries.map((country) => [country.cca3, country]))
  const simple = countries.filter((country) => country.borders.length <= 2)
  const pool = simple.length >= 4 ? simple : [...countries]
  const country = familiar(pool, rng)[0]
  if (!country) return null
  const answer = country.borders.length
  const choices = new Set<number>([answer])
  for (const delta of shuffle([2, -2, 3, -3, 4, 5, -4, 6], rng)) {
    const value = answer + delta
    if (value >= 0 && value <= 8) choices.add(value)
    if (choices.size === 4) break
  }
  for (let value = 0; choices.size < 4 && value <= 12; value += 1) choices.add(value)
  const names = neighborNames(country, byCode)
  const explanation =
    names.length === 0
      ? `${country.name.common} has no land borders.`
      : `${country.name.common} borders ${names.join(' and ')}.`
  return question(
    `borders-${index}`,
    'borders',
    `How many countries share a land border with ${country.name.common}?`,
    [...choices].map((value) => ({ id: String(value), label: String(value) })),
    String(answer),
    explanation,
    rng,
  )
}

function borderMatch(countries: readonly Country[], rng: Rng, index: number): TriviaQuestion | null {
  const byCode = new Map(countries.map((country) => [country.cca3, country]))
  const candidates = familiar(
    countries.filter((country) => country.borders.length >= 1 && country.borders.length <= 3),
    rng,
  )
  for (const country of candidates) {
    const neighbors = country.borders
      .map((code) => byCode.get(code))
      .filter((item): item is Country => Boolean(item))
    const outsiders = others(countries, country).filter(
      (item) => !country.borders.includes(item.cca3) && item.subregion !== country.subregion,
    )
    const fallback = others(countries, country).filter((item) => !country.borders.includes(item.cca3))
    const decoys = outsiders.length >= 3 ? outsiders : fallback
    if (neighbors.length === 0 || decoys.length < 3) continue
    const neighbor = sample(neighbors, 1, rng)[0]
    const shown = sample(decoys, 3, rng)
    return question(
      `border-match-${index}`,
      'border-match',
      `Which of these countries borders ${country.name.common}?`,
      [neighbor, ...shown].map((item) => ({ id: item.cca3, label: item.name.common })),
      neighbor.cca3,
      `${neighbor.name.common} shares a land border with ${country.name.common}.`,
      rng,
    )
  }
  return null
}

function comparison(
  countries: readonly Country[],
  rng: Rng,
  index: number,
  field: 'population' | 'area',
): TriviaQuestion | null {
  const pool = countries.filter((country) => country[field] > 0)
  if (pool.length < 2) return null
  const [left, right] = sample(pool, 2, rng)
  if (left[field] === right[field]) return null
  const winner = left[field] > right[field] ? left : right
  const noun = field === 'population' ? 'a higher population' : 'a larger land area'
  const unit = field === 'population' ? 'people' : 'km²'
  const figure = (country: Country) => `${country.name.common}: ${country[field].toLocaleString('en-US')} ${unit}`
  return question(
    `${field}-${index}`,
    field,
    `Which country has ${noun}: ${left.name.common} or ${right.name.common}?`,
    [left, right].map((country) => ({ id: country.cca3, label: country.name.common })),
    winner.cca3,
    `${figure(left)}. ${figure(right)}.`,
    rng,
  )
}

function capital(countries: readonly Country[], rng: Rng, index: number): TriviaQuestion | null {
  const pool = countries.filter((country) => country.capital[0])
  const country = sample(pool, 1, rng)[0]
  if (!country) return null
  const answer = country.capital[0]
  const distractors = [...new Set(others(pool, country).map((item) => item.capital[0]))].filter(
    (name) => name && name !== answer,
  )
  if (distractors.length < 3) return null
  const choices = [answer, ...sample(distractors, 3, rng)].map((name) => ({ id: name, label: name }))
  return question(
    `capital-${index}`,
    'capital',
    `What is the capital of ${country.name.common}?`,
    choices,
    answer,
    `${answer} is the capital of ${country.name.common}.`,
    rng,
  )
}

function flag(countries: readonly Country[], rng: Rng, index: number): TriviaQuestion | null {
  if (countries.length < 4) return null
  const picked = sample(countries, 4, rng)
  const answer = picked[0]
  return question(
    `flag-${index}`,
    'flag',
    `Which of these is the national flag of ${answer.name.common}?`,
    picked.map((country) => ({ id: country.cca3, label: country.name.common, flagCca2: country.cca2 })),
    answer.cca3,
    `The highlighted flag belongs to ${answer.name.common}.`,
    rng,
  )
}

function landlocked(countries: readonly Country[], rng: Rng, index: number): TriviaQuestion | null {
  const country = sample(countries, 1, rng)[0]
  if (!country) return null
  const answer = country.landlocked ? 'true' : 'false'
  return question(
    `landlocked-${index}`,
    'landlocked',
    `Is ${country.name.common} completely landlocked?`,
    [
      { id: 'true', label: 'Yes, no sea coast' },
      { id: 'false', label: 'No, it has a coast' },
    ],
    answer,
    country.landlocked
      ? `${country.name.common} has no sea coast.`
      : `${country.name.common} has a coastline.`,
    rng,
  )
}

function subregion(countries: readonly Country[], rng: Rng, index: number): TriviaQuestion | null {
  const pool = countries.filter((country) => country.subregion)
  const country = sample(pool, 1, rng)[0]
  if (!country) return null
  const regions = [...new Set(pool.map((item) => item.subregion))]
  const distractors = regions.filter((name) => name !== country.subregion)
  if (distractors.length < 1) return null
  const labels = [country.subregion, ...sample(distractors, Math.min(3, distractors.length), rng)]
  return question(
    `subregion-${index}`,
    'subregion',
    `Which subregion does ${country.name.common} belong to?`,
    labels.map((name) => ({ id: name, label: name })),
    country.subregion,
    `${country.name.common} is in ${country.subregion}.`,
    rng,
  )
}

function currency(countries: readonly Country[], rng: Rng, index: number): TriviaQuestion | null {
  const labeled = countries.flatMap((country) => {
    const entry = Object.values(country.currencies)[0]
    if (!entry?.name) return []
    const label = entry.symbol ? `${entry.name} (${entry.symbol})` : entry.name
    return [{ country, label }]
  })
  const country = sample(labeled, 1, rng)[0]
  if (!country) return null
  const distractors = [...new Set(labeled.map((item) => item.label))].filter((label) => label !== country.label)
  if (distractors.length < 3) return null
  const choices = [country.label, ...sample(distractors, 3, rng)].map((label) => ({ id: label, label }))
  return question(
    `currency-${index}`,
    'currency',
    `What is the currency of ${country.country.name.common}?`,
    choices,
    country.label,
    `${country.country.name.common} uses the ${country.label}.`,
    rng,
  )
}

const BUILDERS: { kind: QuestionKind; build: Builder }[] = [
  { kind: 'borders', build: borderCount },
  { kind: 'border-match', build: borderMatch },
  { kind: 'population', build: (countries, rng, index) => comparison(countries, rng, index, 'population') },
  { kind: 'area', build: (countries, rng, index) => comparison(countries, rng, index, 'area') },
  { kind: 'capital', build: capital },
  { kind: 'flag', build: flag },
  { kind: 'landlocked', build: landlocked },
  { kind: 'subregion', build: subregion },
  { kind: 'currency', build: currency },
]

function takeQuestion(questions: TriviaQuestion[], next: TriviaQuestion | null): void {
  if (!next) return
  if (questions.some((item) => item.kind === next.kind || item.prompt === next.prompt)) return
  questions.push(next)
}

export function buildTriviaRound(countries: readonly Country[], rng: Rng, log?: AnswerLog): TriviaQuestion[] {
  const hasHistory = Boolean(log && Object.keys(log.kinds).length > 0)
  const bag: Builder[] = []
  const ranked = hasHistory
    ? [...BUILDERS].sort((left, right) => kindWeight(log, right.kind) - kindWeight(log, left.kind))
    : BUILDERS
  for (const builder of ranked) {
    const copies = hasHistory ? Math.max(1, Math.round(kindWeight(log, builder.kind) * 3)) : 1
    for (let copy = 0; copy < copies; copy += 1) bag.push(builder.build)
  }
  const order = hasHistory ? shuffle(bag, rng) : bag
  const questions: TriviaQuestion[] = []
  let guard = 0
  while (questions.length < TRIVIA_TARGET && guard < order.length) {
    takeQuestion(questions, order[guard](countries, rng, questions.length))
    guard += 1
  }
  return questions
}
