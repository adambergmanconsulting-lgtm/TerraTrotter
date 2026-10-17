import { describe, expect, it } from 'vitest'
import { countryFacts, densestPhrase, ordinalRank, sizePhrase } from './countryFacts'
import type { Country } from '../types/country'

function place(partial: Partial<Country> & Pick<Country, 'cca3' | 'population' | 'area'>): Country {
  return {
    cca2: 'xx',
    ccn3: '000',
    name: { common: partial.cca3, official: partial.cca3 },
    continent: 'Europe',
    subregion: 'Northern Europe',
    capital: ['Town'],
    borders: [],
    landlocked: false,
    flags: { svg: '', png: '' },
    currencies: {},
    languages: {},
    ...partial,
  } as Country
}

describe('countryFacts', () => {
  it('ranks population and area on the map set', () => {
    const peers = [
      place({ cca3: 'BIG', population: 80_000_000, area: 500_000 }),
      place({ cca3: 'MID', population: 10_000_000, area: 100_000 }),
      place({ cca3: 'SML', population: 1_000_000, area: 10_000 }),
    ]
    const mid = countryFacts(peers[1], peers)
    expect(mid.population).toContain('2nd most populous on this map (2 of 3')
    expect(mid.area).toContain('2nd largest on this map (2 of 3')
    expect(mid.density).toContain('people / km²')
  })

  it('names a missing capital and landlocked coasts', () => {
    const country = place({ cca3: 'X', population: 0, area: 1.5, capital: [], landlocked: true, subregion: '' })
    const facts = countryFacts(country, [country])
    expect(facts.capital).toBe('No capital listed')
    expect(facts.area).toContain('2 km²')
    expect(facts.coastline).toBe('Landlocked')
    expect(facts.subregion).toBe('No subregion listed')
  })

  it('lists neighbors that are also on the map', () => {
    const peers = [
      place({ cca3: 'AAA', population: 1, area: 1, borders: ['BBB', 'ZZZ'] }),
      place({ cca3: 'BBB', population: 1, area: 1, name: { common: 'Beta', official: 'Beta' } }),
    ]
    expect(countryFacts(peers[0], peers).neighbors).toBe('1 · Beta')
  })
})

describe('rank phrases', () => {
  it('uses ordinary English for the ends of the list', () => {
    expect(sizePhrase(1, 10, 'largest')).toBe('largest')
    expect(sizePhrase(2, 10, 'most populous')).toBe('2nd most populous')
    expect(sizePhrase(10, 10, 'largest')).toBe('smallest')
    expect(densestPhrase(1, 5)).toBe('densest')
    expect(densestPhrase(5, 5)).toBe('least dense')
    expect(ordinalRank(11)).toBe('11th')
    expect(ordinalRank(22)).toBe('22nd')
  })
})
