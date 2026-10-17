import { readFileSync } from 'node:fs'
import { geoArea, geoBounds, geoCentroid, geoContains } from 'd3-geo'
import { describe, expect, it } from 'vitest'
import { continentFeatures, labelSite, mapLabelVisible, projectChartDecor, projectContinent, SCANDINAVIA, SCANDINAVIAN_BEASTS } from './mapGeometry'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'

const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as Country[]
const topology = JSON.parse(readFileSync('public/data/world-50m.json', 'utf8')) as unknown as Topology

function widestPathStep(d: string): number {
  const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
  let widest = 0
  for (let i = 2; i < nums.length; i += 2) widest = Math.max(widest, Math.abs(nums[i] - nums[i - 2]))
  return widest
}

describe('continent map clip', () => {
  it('keeps Europe west of the Urals and north of Africa', () => {
    const features = continentFeatures(topology, countries, 'Europe')
    expect(features.some((item) => item.properties.country.cca3 === 'FRA')).toBe(true)
    const bounds = geoBounds({ type: 'FeatureCollection', features })
    expect(bounds[0][1]).toBeGreaterThan(30)
    expect(bounds[1][0]).toBeGreaterThan(50)
    expect(bounds[1][0]).toBeLessThan(70)
  })

  it('draws Asian Russia on the Asia map and keeps European Russia on Europe', () => {
    const europe = continentFeatures(topology, countries, 'Europe').find((item) => item.properties.country.cca3 === 'RUS')
    const asia = continentFeatures(topology, countries, 'Asia').find((item) => item.properties.country.cca3 === 'RUS')
    expect(europe).toBeTruthy()
    expect(asia).toBeTruthy()
    expect(geoBounds(europe!)[1][0]).toBeGreaterThan(59)
    expect(geoBounds(europe!)[1][0]).toBeLessThanOrEqual(60)
    expect(geoArea(europe!)).toBeGreaterThan(0.04)
    expect(geoBounds(asia!)[0][0]).toBeGreaterThanOrEqual(59)
    expect(geoBounds(asia!)[0][0]).toBeLessThanOrEqual(61)
    expect(geoArea(asia!)).toBeGreaterThan(geoArea(europe!))
    expect(geoBounds(asia!)[1][0]).toBeGreaterThan(170)
    expect(geoBounds(asia!)[1][0]).toBeLessThanOrEqual(180)
    const shapes = projectContinent(topology, countries, 'Asia', 900, 500)
    const russia = shapes.find((shape) => shape.cca3 === 'RUS')
    const china = shapes.find((shape) => shape.cca3 === 'CHN')
    expect(russia).toBeTruthy()
    expect(china).toBeTruthy()
    expect(russia!.area).toBeGreaterThan(china!.area)
    expect(russia!.area).toBeLessThan(900 * 500)
    expect(widestPathStep(russia!.d)).toBeLessThan(200)
  })

  it('keeps the Falkland Islands on the Americas map', () => {
    const features = continentFeatures(topology, countries, 'Americas')
    expect(features.some((item) => item.properties.country.cca3 === 'FLK')).toBe(true)
  })

  it('places Scandinavian chart beasts in open water', () => {
    const features = continentFeatures(topology, countries, 'Europe')
    const decor = projectChartDecor(topology, countries, 'Europe', 800, 480, SCANDINAVIA)
    expect(decor?.graticule.length).toBeGreaterThan(20)
    expect(decor?.beasts.map((beast) => beast.kind).sort()).toEqual(['kraken', 'serpent', 'swine', 'whale'])
    for (const beast of SCANDINAVIAN_BEASTS) {
      expect(features.some((item) => geoContains(item, [beast.lon, beast.lat]))).toBe(false)
    }
    for (const beast of decor!.beasts) {
      expect(beast.x).toBeGreaterThan(0)
      expect(beast.x).toBeLessThan(800)
      expect(beast.y).toBeGreaterThan(0)
      expect(beast.y).toBeLessThan(480)
    }
  })

  it('draws a path for each clipped country', () => {
    const shapes = projectContinent(topology, countries, 'Africa', 800, 480)
    expect(shapes.length).toBeGreaterThan(20)
    expect(shapes.every((shape) => shape.d.length > 0)).toBe(true)
    expect(shapes.every((shape) => Number.isFinite(shape.labelX) && Number.isFinite(shape.labelY))).toBe(true)
  })

  it('keeps Croatia’s name inside the country, near the center', () => {
    const features = continentFeatures(topology, countries, 'Europe')
    const croatia = features.find((item) => item.properties.country.cca3 === 'HRV')
    const france = features.find((item) => item.properties.country.cca3 === 'FRA')
    expect(croatia).toBeTruthy()
    expect(france).toBeTruthy()
    const croatiaSite = labelSite(croatia!)
    expect(geoContains(croatia!, croatiaSite)).toBe(true)
    expect(geoContains(croatia!, geoCentroid(croatia!))).toBe(false)
    const franceSite = labelSite(france!)
    const franceCenter = geoCentroid(france!)
    expect(Math.hypot(franceSite[0] - franceCenter[0], franceSite[1] - franceCenter[1])).toBeLessThan(0.05)
  })

  it('shows a country name only once it is large enough on screen', () => {
    expect(mapLabelVisible(100, 1)).toBe(false)
    expect(mapLabelVisible(100, 4)).toBe(true)
    expect(mapLabelVisible(2_000, 1)).toBe(true)
  })
})
