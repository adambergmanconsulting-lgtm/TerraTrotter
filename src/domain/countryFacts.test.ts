import { describe, expect, it } from 'vitest'
import { countryFacts, densestPhrase, economyPhrase, moneyUsd, ordinalRank, sizePhrase } from './countryFacts'
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
    religions: [],
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

  it('lists languages, religions, and currency', () => {
    const country = place({
      cca3: 'HRV',
      population: 1,
      area: 1,
      languages: { hrv: 'Croatian' },
      religions: [
        { name: 'Christianity', share: 86 },
        { name: 'Unaffiliated', share: 13 },
      ],
      currencies: { EUR: { name: 'euro', symbol: '€' } },
    })
    const facts = countryFacts(country, [country])
    expect(facts.languages).toBe('Croatian')
    expect(facts.religions).toBe('Christianity 86%, Unaffiliated 13%')
    expect(facts.currency).toBe('euro (€)')
  })

  it('ranks GDP among countries that have an economy figure', () => {
    const peers = [
      place({ cca3: 'BIG', population: 1, area: 1, economy: { gdpUsd: 2_000_000_000_000, gdpPerCapitaUsd: 40_000, year: 2025 } }),
      place({ cca3: 'MID', population: 1, area: 1, economy: { gdpUsd: 100_000_000_000, gdpPerCapitaUsd: 20_000, year: 2025 } }),
      place({ cca3: 'SML', population: 1, area: 1 }),
    ]
    const mid = countryFacts(peers[1], peers)
    expect(mid.gdp).toContain('$100 billion (2025)')
    expect(mid.gdp).toContain('2nd largest economy on this map (2 of 2)')
    expect(mid.gdpPerCapita).toContain('$20,000')
    expect(mid.gdpPerCapita).toContain('2nd highest GDP per person on this map (2 of 2)')
    expect(countryFacts(peers[2], peers).gdp).toBe('No GDP listed')
  })
})

describe('rank phrases', () => {
  it('uses ordinary English for the ends of the list', () => {
    expect(sizePhrase(1, 10, 'largest')).toBe('largest')
    expect(sizePhrase(2, 10, 'most populous')).toBe('2nd most populous')
    expect(sizePhrase(10, 10, 'largest')).toBe('smallest')
    expect(densestPhrase(1, 5)).toBe('densest')
    expect(densestPhrase(5, 5)).toBe('least dense')
    expect(economyPhrase(1, 5, 'largest economy')).toBe('largest economy')
    expect(economyPhrase(5, 5, 'highest GDP per person')).toBe('lowest GDP per person')
    expect(ordinalRank(11)).toBe('11th')
    expect(ordinalRank(22)).toBe('22nd')
  })

  it('formats dollar amounts in plain units', () => {
    expect(moneyUsd(30_769_700_000_000)).toBe('$30.8 trillion')
    expect(moneyUsd(105_060_182_186)).toBe('$105 billion')
    expect(moneyUsd(23_456)).toBe('$23,456')
  })
})
