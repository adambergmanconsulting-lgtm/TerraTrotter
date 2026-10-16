import { pinpointMinArea, type AnswerLog } from './answerLog'
import type { Country } from '../types/country'
import { sample, type Rng } from './random'

export const PINPOINT_TARGET = 8
export const TRIVIA_TARGET = 8

export function samplePinpoint(countries: readonly Country[], rng: Rng, log?: AnswerLog): Country[] {
  const substantial = countries.filter((country) => country.area >= pinpointMinArea(log))
  const pool = substantial.length >= 5 ? substantial : [...countries]
  const count = Math.min(PINPOINT_TARGET, pool.length)
  return sample(pool, count, rng)
}
