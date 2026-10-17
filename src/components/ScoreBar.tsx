import { Flame, Timer } from 'lucide-react'
import type { Stage } from '../hooks/useQuizEngine'
import { formatClock, type ScoreState } from '../domain/scoring'

interface ScoreBarProps {
  continent: string
  difficultyLabel: string
  stage: Stage
  index: number
  total: number
  score: ScoreState
  elapsed: number
  secondsLeft: number
  secondsLimit: number
  onExit: () => void
}

export function ScoreBar({
  continent,
  difficultyLabel,
  stage,
  index,
  total,
  score,
  elapsed,
  secondsLeft,
  secondsLimit,
  onExit,
}: ScoreBarProps) {
  const stageLabel = stage === 'pinpoint' ? 'Map pinpoint' : stage === 'trivia' ? 'Country trivia' : 'Results'
  const ratio = secondsLimit === 0 ? 0 : secondsLeft / secondsLimit
  return (
    <header className="flex flex-wrap items-center gap-3 rounded-2xl bg-tide/90 px-4 py-3 text-foam shadow-lg">
      <button type="button" onClick={onExit} className="text-sm font-semibold text-gold underline-offset-2 hover:underline">
        All continents
      </button>
      <p className="font-display text-xl text-foam">
        {continent}
        <span className="ml-2 font-sans text-sm font-semibold tracking-wide text-foam/70">
          {difficultyLabel} · {stageLabel}
        </span>
      </p>
      <p className="ml-auto flex items-center gap-4 text-sm font-semibold">
        {stage !== 'results' && (
          <span>
            {index + 1} / {total}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Flame className="size-4 text-gold" aria-hidden />
          {score.streak}
        </span>
        <span>{score.score} pts</span>
        <span aria-label={`Time ${formatClock(stage === 'results' ? score.seconds : elapsed)}`}>
          {formatClock(stage === 'results' ? score.seconds : elapsed)}
        </span>
        {stage !== 'results' && secondsLimit > 0 && (
          <span className="inline-flex items-center gap-1">
            <Timer className="size-4" aria-hidden />
            {secondsLeft}s
          </span>
        )}
      </p>
      {stage !== 'results' && secondsLimit > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-foam/20" aria-hidden>
          <div className="h-full bg-gold transition-[width]" style={{ width: `${ratio * 100}%` }} />
        </div>
      )}
    </header>
  )
}
