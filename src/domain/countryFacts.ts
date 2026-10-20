import type { Country } from '../types/country'

const number = new Intl.NumberFormat('en-US')

export interface CountryFacts {
  capital: string
  population: string
  area: string
  density: string
  neighbors: string
  coastline: string
  subregion: string
  languages: string
  religions: string
  currency: string
  gdp: string
  gdpPerCapita: string
}

export function ordinalRank(rank: number): string {
  const rem100 = rank % 100
  if (rem100 >= 11 && rem100 <= 13) return `${rank}th`
  const rem10 = rank % 10
  if (rem10 === 1) return `${rank}st`
  if (rem10 === 2) return `${rank}nd`
  if (rem10 === 3) return `${rank}rd`
  return `${rank}th`
}

export function sizePhrase(rank: number, total: number, kind: 'largest' | 'most populous'): string {
  if (rank === 1) return kind === 'largest' ? 'largest' : 'most populous'
  if (rank === 2) return `2nd ${kind === 'largest' ? 'largest' : 'most populous'}`
  if (rank === 3) return `3rd ${kind === 'largest' ? 'largest' : 'most populous'}`
  if (rank === total) return kind === 'largest' ? 'smallest' : 'least populous'
  if (rank === total - 1) return kind === 'largest' ? '2nd smallest' : '2nd least populous'
  return `${ordinalRank(rank)} ${kind === 'largest' ? 'largest' : 'most populous'}`
}

export function densestPhrase(rank: number, total: number): string {
  if (rank === 1) return 'densest'
  if (rank === 2) return '2nd densest'
  if (rank === 3) return '3rd densest'
  if (rank === total) return 'least dense'
  if (rank === total - 1) return '2nd least dense'
  return `${ordinalRank(rank)} densest`
}

export function economyPhrase(rank: number, total: number, kind: 'largest economy' | 'highest GDP per person'): string {
  if (rank === 1) return kind === 'largest economy' ? 'largest economy' : 'highest GDP per person'
  if (rank === 2) return `2nd ${kind === 'largest economy' ? 'largest economy' : 'highest GDP per person'}`
  if (rank === 3) return `3rd ${kind === 'largest economy' ? 'largest economy' : 'highest GDP per person'}`
  if (rank === total) return kind === 'largest economy' ? 'smallest economy' : 'lowest GDP per person'
  if (rank === total - 1) return kind === 'largest economy' ? '2nd smallest economy' : '2nd lowest GDP per person'
  return `${ordinalRank(rank)} ${kind === 'largest economy' ? 'largest economy' : 'highest GDP per person'}`
}

/** Compact US dollar amounts for study facts. */
export function moneyUsd(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000_000) return `$${(amount / 1_000_000_000_000).toFixed(abs >= 10_000_000_000_000 ? 1 : 2)} trillion`
  if (abs >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(abs >= 100_000_000_000 ? 0 : 1)} billion`
  if (abs >= 1_000_000) return `$${number.format(Math.round(amount / 1_000_000))} million`
  return `$${number.format(Math.round(amount))}`
}

function rankOf(value: number, values: readonly number[], higherIsBetter: boolean): number {
  const ordered = [...values].sort((a, b) => (higherIsBetter ? b - a : a - b))
  return ordered.indexOf(value) + 1
}

function neighborNames(country: Country, peers: readonly Country[]): string[] {
  const byCode = new Map(peers.map((peer) => [peer.cca3, peer.name.common]))
  return country.borders.flatMap((code) => {
    const name = byCode.get(code)
    return name ? [name] : []
  })
}

function languageList(country: Country): string {
  const names = Object.values(country.languages)
  return names.length > 0 ? names.join(', ') : 'No languages listed'
}

function religionList(country: Country): string {
  const rows = country.religions ?? []
  if (rows.length === 0) return 'No religion listed'
  return rows
    .map((row) => (row.share == null ? row.name : `${row.name} ${row.share}%`))
    .join(', ')
}

function currencyList(country: Country): string {
  const rows = Object.values(country.currencies)
  if (rows.length === 0) return 'No currency listed'
  return rows
    .map((row) => {
      const symbol = row.symbol ? ` (${row.symbol})` : ''
      return `${row.name}${symbol}`
    })
    .join(', ')
}

function gdpLine(country: Country, peers: readonly Country[]): string {
  const value = country.economy?.gdpUsd
  if (value == null) return 'No GDP listed'
  const ranked = peers.filter((peer) => peer.economy?.gdpUsd != null)
  const total = ranked.length
  const rank = rankOf(value, ranked.map((peer) => peer.economy!.gdpUsd), true)
  const year = country.economy?.year
  return `${moneyUsd(value)}${year ? ` (${year})` : ''} · ${economyPhrase(rank, total, 'largest economy')} on this map (${rank} of ${total})`
}

function gdpPerCapitaLine(country: Country, peers: readonly Country[]): string {
  const value = country.economy?.gdpPerCapitaUsd
  if (value == null) return 'No GDP per person listed'
  const ranked = peers.filter((peer) => peer.economy?.gdpPerCapitaUsd != null)
  const total = ranked.length
  const rank = rankOf(value, ranked.map((peer) => peer.economy!.gdpPerCapitaUsd!), true)
  return `${moneyUsd(value)} · ${economyPhrase(rank, total, 'highest GDP per person')} on this map (${rank} of ${total})`
}

export function countryFacts(country: Country, peers: readonly Country[] = [country]): CountryFacts {
  const total = peers.length
  const populations = peers.map((peer) => peer.population)
  const areas = peers.map((peer) => peer.area)
  const densities = peers.map((peer) => (peer.area > 0 ? peer.population / peer.area : 0))
  const density = country.area > 0 ? country.population / country.area : 0
  const popRank = rankOf(country.population, populations, true)
  const areaRank = rankOf(country.area, areas, true)
  const densityRank = rankOf(density, densities, true)
  const names = neighborNames(country, peers)
  const sharePop = total > 0 ? (country.population / peers.reduce((sum, peer) => sum + peer.population, 0)) * 100 : 0
  const shareArea = total > 0 ? (country.area / peers.reduce((sum, peer) => sum + peer.area, 0)) * 100 : 0

  return {
    capital: country.capital[0] ?? 'No capital listed',
    population: `${number.format(country.population)} · ${sizePhrase(popRank, total, 'most populous')} on this map (${popRank} of ${total}, ${sharePop < 0.1 ? '<0.1' : sharePop.toFixed(1)}%)`,
    area: `${number.format(Math.round(country.area))} km² · ${sizePhrase(areaRank, total, 'largest')} on this map (${areaRank} of ${total}, ${shareArea < 0.1 ? '<0.1' : shareArea.toFixed(1)}%)`,
    density: `${number.format(Math.round(density))} people / km² · ${densestPhrase(densityRank, total)} on this map`,
    neighbors:
      names.length === 0
        ? country.landlocked
          ? 'No listed neighbors'
          : 'No land neighbors on this map'
        : `${names.length} · ${names.sort((a, b) => a.localeCompare(b)).join(', ')}`,
    coastline: country.landlocked ? 'Landlocked' : 'Has a coast',
    subregion: country.subregion || 'No subregion listed',
    languages: languageList(country),
    religions: religionList(country),
    currency: currencyList(country),
    gdp: gdpLine(country, peers),
    gdpPerCapita: gdpPerCapitaLine(country, peers),
  }
}
