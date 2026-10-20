export interface Country {
  cca2: string
  cca3: string
  ccn3: string
  name: { common: string; official: string }
  continent: string
  subregion: string
  capital: string[]
  population: number
  area: number
  borders: string[]
  landlocked: boolean
  flags: { svg: string; png: string; alt?: string }
  currencies: Record<string, { name: string; symbol: string }>
  languages: Record<string, string>
  /** Major affiliations. Share is percent of population when known. */
  religions: { name: string; share?: number }[]
  /** Latest World Bank GDP (current US$) when available. */
  economy?: { gdpUsd: number; gdpPerCapitaUsd?: number; year: number }
}

export const CONTINENTS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'] as const
export type ContinentName = (typeof CONTINENTS)[number]
