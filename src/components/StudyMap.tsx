import { useMemo, useState } from 'react'
import { countryFacts } from '../domain/countryFacts'
import { continentFeatures } from '../domain/mapGeometry'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'
import { FlagMark } from './FlagMark'
import { MapViewer } from './MapViewer'

interface StudyMapProps {
  continent: string
  countries: readonly Country[]
  topology: Topology
  onExit: () => void
}

export function StudyMap({ continent, countries, topology, onExit }: StudyMapProps) {
  const listed = useMemo(() => {
    const onMap = new Set(continentFeatures(topology, countries, continent).map((item) => item.properties.country.cca3))
    return countries.filter((country) => onMap.has(country.cca3))
  }, [topology, countries, continent])
  const [selected, setSelected] = useState<Country | null>(null)
  const shown = selected ?? listed[0]
  const facts = selected ? countryFacts(selected, listed) : null

  if (!shown) {
    return (
      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6">
        <button type="button" onClick={onExit} className="text-sm font-semibold text-tide underline-offset-2 hover:underline">
          All continents
        </button>
        <p className="text-lg text-ink">This continent has no countries on the map.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onExit} className="text-sm font-semibold text-tide underline-offset-2 hover:underline">
          All continents
        </button>
        <h1 className="font-display text-4xl text-ink">{continent}</h1>
        <p className="text-sm font-semibold tracking-wide text-tide uppercase">Study</p>
      </header>
      <section className="grid gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-tide/10" aria-live="polite">
        {selected && facts ? (
          <>
            <p className="flex items-center gap-3 font-display text-3xl text-ink">
              <FlagMark cca2={selected.cca2} className="h-8 w-12 rounded shadow-sm" />
              {selected.name.common}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-semibold text-tide">Capital</dt>
              <dd>{facts.capital}</dd>
              <dt className="font-semibold text-tide">Population</dt>
              <dd>{facts.population}</dd>
              <dt className="font-semibold text-tide">Area</dt>
              <dd>{facts.area}</dd>
              <dt className="font-semibold text-tide">Density</dt>
              <dd>{facts.density}</dd>
              <dt className="font-semibold text-tide">Neighbors</dt>
              <dd>{facts.neighbors}</dd>
              <dt className="font-semibold text-tide">Coast</dt>
              <dd>{facts.coastline}</dd>
              <dt className="font-semibold text-tide">Subregion</dt>
              <dd>{facts.subregion}</dd>
              <dt className="font-semibold text-tide">Languages</dt>
              <dd>{facts.languages}</dd>
              <dt className="font-semibold text-tide">Religions</dt>
              <dd>{facts.religions}</dd>
              <dt className="font-semibold text-tide">Currency</dt>
              <dd>{facts.currency}</dd>
              <dt className="font-semibold text-tide">GDP</dt>
              <dd>{facts.gdp}</dd>
              <dt className="font-semibold text-tide">GDP per person</dt>
              <dd>{facts.gdpPerCapita}</dd>
            </dl>
          </>
        ) : (
          <p className="text-ink/80">Click a country on the map. Zoom in to see more names.</p>
        )}
      </section>
      <MapViewer
        topology={topology}
        countries={countries}
        continent={continent}
        target={shown}
        pinMark="idle"
        picked={null}
        onPick={(cca3) => setSelected(listed.find((country) => country.cca3 === cca3) ?? null)}
        hidePrompt
        frameCompass
        frameCca3={selected?.cca3 ?? null}
        showLabels
      />
    </main>
  )
}
