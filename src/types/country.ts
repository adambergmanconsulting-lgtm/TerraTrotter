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
}

export const CONTINENTS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'] as const
export type ContinentName = (typeof CONTINENTS)[number]
