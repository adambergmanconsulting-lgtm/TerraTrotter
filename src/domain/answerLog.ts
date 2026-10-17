export interface KindStat {
  asked: number
  correct: number
}

export interface AnswerLog {
  kinds: Record<string, KindStat>
}

export const ANSWER_LOG_KEY = 'terratrotter.answers.v1'

export const emptyAnswerLog = (): AnswerLog => ({ kinds: {} })

export function recordAnswer(log: AnswerLog, kind: string, correct: boolean): AnswerLog {
  const prior = log.kinds[kind] ?? { asked: 0, correct: 0 }
  return {
    kinds: {
      ...log.kinds,
      [kind]: { asked: prior.asked + 1, correct: prior.correct + (correct ? 1 : 0) },
    },
  }
}

/** Kinds the player keeps missing are drawn less often. New kinds stay at a normal rate. */
export function kindWeight(log: AnswerLog | undefined, kind: string): number {
  const stat = log?.kinds[kind]
  if (!stat || stat.asked < 4) return 1
  const rate = stat.correct / stat.asked
  if (rate < 0.5) return 0.35
  if (rate < 0.75) return 0.7
  return 1
}

export const PINPOINT_OPEN_AREA = 1000

export function pinpointMinArea(log: AnswerLog | undefined): number {
  const stat = log?.kinds.pinpoint
  if (!stat || stat.asked < 4) return PINPOINT_OPEN_AREA
  return stat.correct / stat.asked < 0.5 ? 200_000 : PINPOINT_OPEN_AREA
}

export function loadAnswerLog(): AnswerLog {
  try {
    const raw = localStorage.getItem(ANSWER_LOG_KEY)
    if (!raw) return emptyAnswerLog()
    const parsed = JSON.parse(raw) as AnswerLog
    if (!parsed || typeof parsed !== 'object' || !parsed.kinds) return emptyAnswerLog()
    return { kinds: parsed.kinds }
  } catch {
    return emptyAnswerLog()
  }
}

export function saveAnswerLog(log: AnswerLog): void {
  localStorage.setItem(ANSWER_LOG_KEY, JSON.stringify(log))
}
