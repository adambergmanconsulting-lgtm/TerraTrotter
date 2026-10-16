import { Check, Globe2 } from 'lucide-react'
import type { ContinentRecord } from '../domain/progress'
import { CONTINENTS, type ContinentName, type Country } from '../types/country'
import type { Topology } from 'topojson-specification'
import { ContinentOutline } from './ContinentOutline'

interface ContinentSelectorProps {
  records: Record<string, ContinentRecord | undefined>
  bestStreak: number
  countries: readonly Country[]
  topology: Topology
  onChoose: (continent: ContinentName) => void
}

const BLURBS: Record<ContinentName, string> = {
  Africa: 'Sahara to the Cape',
  Americas: 'Tierra del Fuego to the Arctic',
  Asia: 'Mediterranean shore to the Pacific',
  Europe: 'Atlantic islands to the Urals',
  Oceania: 'Australia and the Pacific',
}

export function ContinentSelector({ records, bestStreak, countries, topology, onChoose }: ContinentSelectorProps) {
  return (
    <section className="grid gap-8">
      <div className="grid gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-lagoon uppercase">
          <Globe2 className="size-4" aria-hidden />
          Geography quiz
        </p>
        <h1 className="font-display text-5xl text-ink sm:text-6xl">TerraTrotter</h1>
        <p className="max-w-xl text-lg text-ink/80">
          Pick a continent. First place the countries on the map, then answer trivia drawn from the same set. Your best
          score stays in this browser.
        </p>
        <p className="text-sm font-semibold text-tide">Best streak so far: {bestStreak}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {CONTINENTS.map((continent) => {
          const record = records[continent]
          return (
            <li key={continent}>
              <button
                type="button"
                onClick={() => onChoose(continent)}
                className="flex h-full w-full items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-tide/10 hover:ring-lagoon"
              >
                <span className="grid min-w-0 flex-1 gap-2">
                  <span className="flex w-full items-center justify-between font-display text-3xl text-ink">
                    {continent}
                    {record && record.bestAccuracy === 1 && <Check className="size-5 text-[#2f8f55]" aria-label="100%" />}
                  </span>
                  <span className="text-ink/70">{BLURBS[continent]}</span>
                  <span className="text-sm font-semibold text-tide">
                    {record ? `Best ${record.bestScore} pts · ${Math.round(record.bestAccuracy * 100)}%` : 'Not played yet'}
                  </span>
                </span>
                <ContinentOutline topology={topology} countries={countries} continent={continent} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
