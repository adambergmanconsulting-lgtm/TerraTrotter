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

// Pew-based shares by ISO3 (FaithMap static dump). Dominant-only fallback by country name.
const faith = await fetch('https://raw.githubusercontent.com/parthadokar/FaithMap/main/static/countries.json').then((res) => {
  if (!res.ok) throw new Error(`Religion breakdown responded ${res.status}`)
  return res.json()
})
const dominantRows = await fetch(
  'https://cdn.jsdelivr.net/gh/samayo/country-json@master/src/country-by-religion.json',
).then((res) => {
  if (!res.ok) throw new Error(`Dominant religion list responded ${res.status}`)
  return res.json()
})
const dominantByName = new Map(
  dominantRows.filter((row) => row.religion).map((row) => [String(row.country).toLowerCase(), row.religion]),
)

const RELIGION_ALIASES = {
  'united states of america': 'united states',
  czechia: 'czech republic',
  "côte d'ivoire": "cote d'ivoire",
  'congo (democratic republic of the)': 'the democratic republic of congo',
  'brunei darussalam': 'brunei',
  'viet nam': 'vietnam',
  'palestine, state of': 'palestine',
  'timor-leste': 'timor',
  'cabo verde': 'cape verde',
  micronesia: 'micronesia (country)',
  'russian federation': 'russia',
  fiji: 'fiji islands',
  réunion: 'reunion',
  'são tomé and príncipe': 'sao tome and principe',
  curaçao: 'curacao',
  'vatican city': 'vatican',
  'faroe islands': 'faeroe islands',
  'bolivia (plurinational state of)': 'bolivia',
  'venezuela (bolivarian republic of)': 'venezuela',
  'iran (islamic republic of)': 'iran',
  'syria arab republic': 'syria',
  "laos people's democratic republic": 'laos',
  'moldova, republic of': 'moldova',
  'tanzania, united republic of': 'tanzania',
}

function dominantReligion(name) {
  const key = name.toLowerCase()
  return dominantByName.get(key) ?? dominantByName.get(RELIGION_ALIASES[key] ?? '') ?? null
}

function religionsFor(country) {
  const entry = faith[country.cca3]
  if (entry?.breakdown?.length) {
    const ranked = [...entry.breakdown].sort((a, b) => b.pct - a.pct)
    const kept = ranked.filter((row, index) => index === 0 || row.pct >= 5).slice(0, 4)
    return kept.map((row) => ({ name: row.religion, share: Math.round(row.pct) }))
  }
  const name = dominantReligion(country.name.common) ?? dominantReligion(country.name.official)
  return name ? [{ name }] : []
}

async function worldBankLatest(indicator) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrnev=1&per_page=400`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`World Bank ${indicator} responded ${res.status}`)
  const payload = await res.json()
  const rows = payload[1] ?? []
  const byCode = new Map()
  for (const row of rows) {
    if (!row.countryiso3code || row.value == null) continue
    byCode.set(row.countryiso3code, { value: Number(row.value), year: Number(row.date) })
  }
  return byCode
}

const gdpTotal = await worldBankLatest('NY.GDP.MKTP.CD')
const gdpPerCapita = await worldBankLatest('NY.GDP.PCAP.CD')

const countries = raw
  .filter((country) => continents.has(country.region) && country.cca3 && country.ccn3 && country.name?.common)
  .map((country) => {
    const base = {
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
    }
    const total = gdpTotal.get(base.cca3)
    const perCapita = gdpPerCapita.get(base.cca3)
    const economy = total
      ? {
          gdpUsd: Math.round(total.value),
          year: total.year,
          ...(perCapita ? { gdpPerCapitaUsd: Math.round(perCapita.value) } : {}),
        }
      : undefined
    return { ...base, religions: religionsFor(base), ...(economy ? { economy } : {}) }
  })
  .sort((a, b) => a.name.common.localeCompare(b.name.common))

writeFileSync(join(outDir, 'countries.json'), `${JSON.stringify(countries)}\n`)
copyFileSync(
  join(root, 'node_modules', 'world-atlas', 'countries-50m.json'),
  join(outDir, 'world-50m.json'),
)

const counts = Object.fromEntries(
  [...continents].map((name) => [name, countries.filter((country) => country.continent === name).length]),
)
const withReligion = countries.filter((country) => country.religions.length > 0).length
const withGdp = countries.filter((country) => country.economy).length
console.log(`Wrote ${countries.length} countries`, counts)
console.log(`Religions listed for ${withReligion} countries`)
console.log(`GDP listed for ${withGdp} countries`)

if (process.env.SKIP_FLAGS === '1') {
  console.log('Skipped flag download (SKIP_FLAGS=1)')
  process.exit(0)
}

const flagDir = join(root, 'public', 'flags')
mkdirSync(flagDir, { recursive: true })

async function saveFlag(country) {
  const dest = join(flagDir, `${country.cca2.toLowerCase()}.svg`)
  const flagResponse = await fetch(country.flags.svg, {
    headers: { 'user-agent': 'TerraTrotter/0.1 (static geography quiz; flag mirror)' },
  })
  if (!flagResponse.ok) throw new Error(`${country.cca2} ${flagResponse.status}`)
  const svg = await flagResponse.text()
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
