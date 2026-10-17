import { Check, Globe2 } from 'lucide-react'
import { showDesignPreview } from '../domain/designPreview'
import { formatClock } from '../domain/scoring'
import { DIFFICULTIES, DIFFICULTY_LABEL, difficultyNote, type Difficulty } from '../domain/difficulty'
import type { ProgressFile } from '../domain/progress'
import { CONTINENTS, type ContinentName, type Country } from '../types/country'
import type { Topology } from 'topojson-specification'
import { ContinentOutline } from './ContinentOutline'

interface ContinentSelectorProps {
  levels: ProgressFile['levels']
  difficulty: Difficulty
  bestStreak: number
  countries: readonly Country[]
  topology: Topology
  onDifficulty: (difficulty: Difficulty) => void
  onChoose: (continent: ContinentName) => void
  onStudy: (continent: ContinentName) => void
}

const BLURBS: Record<ContinentName, string> = {
  Africa: 'Sahara to the Cape',
  Americas: 'Tierra del Fuego to the Arctic',
  Asia: 'Mediterranean shore to the Pacific',
  Europe: 'Atlantic islands to the Urals',
  Oceania: 'Australia and the Pacific',
}

export function ContinentSelector({
  levels,
  difficulty,
  bestStreak,
  countries,
  topology,
  onDifficulty,
  onChoose,
  onStudy,
}: ContinentSelectorProps) {
  return (
    <section className="grid gap-8">
      <div className="grid gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-lagoon uppercase">
          <Globe2 className="size-4" aria-hidden />
          Geography quiz
        </p>
        <h1 className="font-display text-5xl text-ink sm:text-6xl">TerraTrotter</h1>
        <p className="max-w-xl text-lg text-ink/80">
          Pick a difficulty, then a continent. First place the countries on the map, then answer trivia drawn from the
          same set. Points use one scale: Hard is worth three times Easy, and a faster correct answer scores up to twice as much. Your best score for that difficulty stays in this browser.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty" aria-describedby="difficulty-note">
          {DIFFICULTIES.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === difficulty}
              onClick={() => onDifficulty(id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${id === difficulty ? 'bg-tide text-foam' : 'bg-white text-tide ring-1 ring-tide/20'}`}
            >
              {DIFFICULTY_LABEL[id]}
            </button>
          ))}
        </div>
        <p id="difficulty-note" className="max-w-xl text-ink/80">
          {difficultyNote(difficulty)}
        </p>
        <p className="text-sm font-semibold text-tide">Best streak so far: {bestStreak}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {CONTINENTS.map((continent) => {
          const record = levels[difficulty][continent]
          return (
            <li key={continent} className="flex h-full flex-col rounded-3xl bg-white shadow-sm ring-1 ring-tide/10">
              <button
                type="button"
                onClick={() => onChoose(continent)}
                className="flex w-full flex-1 items-center gap-4 p-5 pb-3 text-left"
              >
                <span className="grid min-w-0 flex-1 gap-2">
                  <span className="flex w-full items-center justify-between font-display text-3xl text-ink">
                    {continent}
                    {record && record.bestAccuracy === 1 && <Check className="size-5 text-[#2f8f55]" aria-label="100%" />}
                  </span>
                  <span className="text-ink/70">{BLURBS[continent]}</span>
                  <span className="text-sm font-semibold text-tide">
                    {record
                      ? `Best ${record.bestScore} pts · ${Math.round(record.bestAccuracy * 100)}%${record.bestSeconds != null ? ` · ${formatClock(record.bestSeconds)}` : ''}`
                      : 'Not played yet'}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                    {DIFFICULTIES.map((id) => {
                      const done = levels[id][continent]?.bestAccuracy === 1
                      return (
                        <span
                          key={id}
                          className={`inline-flex items-center gap-1 ${done ? 'text-[#2f8f55]' : 'text-ink/35'}`}
                          aria-label={`${DIFFICULTY_LABEL[id]} ${done ? '100%' : 'open'}`}
                        >
                          <span className={`size-2 rounded-full ${done ? 'bg-[#2f8f55]' : 'bg-tide/25'}`} aria-hidden />
                          {DIFFICULTY_LABEL[id]}
                        </span>
                      )
                    })}
                  </span>
                </span>
                <ContinentOutline topology={topology} countries={countries} continent={continent} />
              </button>
              <div className="mt-auto px-5 pb-4">
                <button type="button" onClick={() => onStudy(continent)} className="text-sm font-semibold text-lagoon underline">
                  Study the map
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {showDesignPreview() && (
        <p className="text-sm text-tide">
          <a href="#/design" className="underline">
            Compare map styles
          </a>
        </p>
      )}
    </section>
  )
}
