import { Trophy } from 'lucide-react'
import { formatClock, type ScoreState } from '../domain/scoring'

interface ResultsModalProps {
  continent: string
  score: ScoreState
  accuracy: number
  bestScore: number
  bestSeconds?: number
  onAgain: () => void
  onHome: () => void
}

export function ResultsModal({ continent, score, accuracy, bestScore, bestSeconds, onAgain, onHome }: ResultsModalProps) {
  const percent = Math.round(accuracy * 100)
  return (
    <section className="mx-auto grid max-w-lg gap-4 rounded-3xl bg-white p-8 text-center shadow-xl">
      <Trophy className="mx-auto size-10 text-gold" aria-hidden />
      <h2 className="font-display text-4xl text-ink">{continent} complete</h2>
      <p className="text-lg text-tide">
        {score.correct} of {score.answered} correct ({percent}%). Best streak {score.bestStreak}. Time {formatClock(score.seconds)}.
      </p>
      <p className="font-display text-5xl text-lagoon">{score.score}</p>
      <p className="text-sm font-semibold tracking-wide text-ink/60 uppercase">
        Best on this continent: {bestScore}
        {bestSeconds != null ? ` · ${formatClock(bestSeconds)}` : ''}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onAgain} className="rounded-full bg-tide px-5 py-2 font-semibold text-foam">
          Play again
        </button>
        <button type="button" onClick={onHome} className="rounded-full border border-tide px-5 py-2 font-semibold text-tide">
          Choose a continent
        </button>
      </div>
    </section>
  )
}
