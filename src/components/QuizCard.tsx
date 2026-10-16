import { FlagMark } from './FlagMark'
import type { TriviaQuestion } from '../domain/trivia'

interface QuizCardProps {
  question: TriviaQuestion
  picked: string | null
  onPick: (choiceId: string) => void
}

export function QuizCard({ question, picked, onPick }: QuizCardProps) {
  const locked = picked !== null
  const flagQuestion = question.choices.some((choice) => choice.flagCca2)
  return (
    <section className="grid gap-5">
      <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{question.prompt}</h2>
      <ul className={`grid gap-3 ${flagQuestion ? 'grid-cols-2' : ''}`}>
        {question.choices.map((choice) => {
          const chosen = picked === choice.id
          const showCorrect = locked && choice.id === question.correctId
          const showWrong = chosen && choice.id !== question.correctId
          const tone = showCorrect
            ? 'border-[#2f8f55] bg-[#e5f6ea]'
            : showWrong
              ? 'border-[#d4533a] bg-[#fde8e4]'
              : 'border-transparent bg-white hover:border-lagoon'
          return (
            <li key={choice.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onPick(choice.id)}
                aria-label={choice.flagCca2 ? 'Flag choice' : undefined}
                className={`w-full rounded-2xl border-2 px-4 py-3 text-left font-semibold text-ink shadow-sm ${tone} ${flagQuestion ? '' : 'text-lg'}`}
              >
                {choice.flagCca2 ? (
                  <span className="flex h-48 w-full items-center justify-center">
                    <FlagMark cca2={choice.flagCca2} className="h-full w-auto max-w-full object-contain" />
                  </span>
                ) : (
                  choice.label
                )}
              </button>
            </li>
          )
        })}
      </ul>
      {locked && <p className="text-lg text-tide">{question.explanation}</p>}
    </section>
  )
}
