import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'
import { SCANDINAVIA } from '../domain/mapGeometry'
import { MAP_SKINS } from '../domain/mapSkin'
import { MapViewer } from './MapViewer'

export function MapStyleGallery({ countries, topology }: { countries: readonly Country[]; topology: Topology }) {
  const target = countries.find((country) => country.cca3 === 'NOR') ?? countries.find((country) => country.continent === 'Europe')
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10">
      <div className="grid gap-3">
        <a href="#/" className="text-sm font-semibold text-tide underline">
          Back to the quiz
        </a>
        <h1 className="font-display text-5xl text-ink">Map styles</h1>
        <p className="max-w-2xl text-lg text-ink/80">
          Scandinavia, three ways. The country shapes are the same. Pinch, scroll, and drag each map.
        </p>
      </div>
      {target && (
        <div className="grid gap-8 lg:grid-cols-3">
          {MAP_SKINS.map((skin) => (
            <section key={skin.id} className="grid gap-3">
              <h2 className="font-display text-3xl text-ink">{skin.title}</h2>
              <p className="text-sm text-ink/80">{skin.note}</p>
              <MapViewer
                topology={topology}
                countries={countries}
                continent="Europe"
                target={target}
                pinMark="idle"
                picked={null}
                onPick={() => undefined}
                skin={skin.id}
                hidePrompt
                focus={SCANDINAVIA}
                ornaments={skin.id === 'chart' ? 'full' : 'none'}
              />
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
