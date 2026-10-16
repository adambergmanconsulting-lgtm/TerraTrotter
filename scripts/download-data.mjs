import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'data')
mkdirSync(outDir, { recursive: true })

// Live restcountries.com v3.1 now requires a paid v5 key. This is the last public
// v3.1 snapshot (same schema the handover names), frozen into public/data.
const source =
  'https://gitlab.com/restcountries/restcountries/-/raw/master/src/main/resources/countriesV3.1.json'
const response = await fetch(source)
if (!response.ok) {
  throw new Error(`Country snapshot responded ${response.status}`)
}

const raw = await response.json()
const continents = new Set(['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'])

const countries = raw
  .filter((country) => continents.has(country.region) && country.cca3 && country.ccn3 && country.name?.common)
  .map((country) => ({
    cca2: country.cca2,
    cca3: country.cca3,
    ccn3: String(country.ccn3).padStart(3, '0'),
    name: { common: country.name.common, official: country.name.official ?? country.name.common },
    continent: country.region,
    subregion: country.subregion ?? '',
    capital: country.capital ?? [],
    population: country.population ?? 0,
    area: country.area ?? 0,
    borders: country.borders ?? [],
    landlocked: Boolean(country.landlocked),
    flags: {
      svg: country.flags?.svg ?? '',
      png: country.flags?.png ?? '',
      alt: country.flags?.alt,
    },
    currencies: country.currencies ?? {},
    languages: country.languages ?? {},
  }))
  .sort((a, b) => a.name.common.localeCompare(b.name.common))

writeFileSync(join(outDir, 'countries.json'), `${JSON.stringify(countries)}\n`)
copyFileSync(
  join(root, 'node_modules', 'world-atlas', 'countries-50m.json'),
  join(outDir, 'world-50m.json'),
)

const counts = Object.fromEntries(
  [...continents].map((name) => [name, countries.filter((country) => country.continent === name).length]),
)
console.log(`Wrote ${countries.length} countries`, counts)

const flagDir = join(root, 'public', 'flags')
mkdirSync(flagDir, { recursive: true })

async function saveFlag(country) {
  const dest = join(flagDir, `${country.cca2.toLowerCase()}.svg`)
  const response = await fetch(country.flags.svg, {
    headers: { 'user-agent': 'TerraTrotter/0.1 (static geography quiz; flag mirror)' },
  })
  if (!response.ok) throw new Error(`${country.cca2} ${response.status}`)
  const svg = await response.text()
  if (!svg.includes('<svg')) throw new Error(`${country.cca2} was not an SVG`)
  writeFileSync(dest, svg)
}

const queue = [...countries]
let failed = 0
async function worker() {
  while (queue.length > 0) {
    const country = queue.pop()
    try {
      await saveFlag(country)
    } catch (error) {
      failed += 1
      console.warn('flag skipped', error.message)
    }
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()))
console.log(`Wrote flags to public/flags (${countries.length - failed} ok, ${failed} skipped)`)
