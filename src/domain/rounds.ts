import { PINPOINT_OPEN_AREA, pinpointMinArea, type AnswerLog } from './answerLog'
import type { Difficulty } from './difficulty'
import type { Country } from '../types/country'
import { sample, type Rng } from './random'

export const PINPOINT_TARGET = 8
export const TRIVIA_TARGET = 8

export function samplePinpoint(
  countries: readonly Country[],
  rng: Rng,
  log?: AnswerLog,
  difficulty: Difficulty = 'medium',
): Country[] {
  const floor = difficulty === 'hard' ? PINPOINT_OPEN_AREA : pinpointMinArea(log)
  const substantial = countries.filter((country) => country.area >= floor)
  const pool = substantial.length >= 5 ? substantial : [...countries]
  const count = Math.min(PINPOINT_TARGET, pool.length)
  return sample(pool, count, rng)
}
