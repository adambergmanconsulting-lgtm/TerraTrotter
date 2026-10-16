import { readFileSync } from 'node:fs'
import { geoBounds } from 'd3-geo'
import { describe, expect, it } from 'vitest'
import { continentFeatures, projectContinent } from './mapGeometry'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'

const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as Country[]
const topology = JSON.parse(readFileSync('public/data/world-50m.json', 'utf8')) as unknown as Topology

describe('continent map clip', () => {
  it('keeps Europe west of the Urals and north of Africa', () => {
    const features = continentFeatures(topology, countries, 'Europe')
    expect(features.some((item) => item.properties.country.cca3 === 'FRA')).toBe(true)
    const bounds = geoBounds({ type: 'FeatureCollection', features })
    expect(bounds[0][1]).toBeGreaterThan(30)
    expect(bounds[1][0]).toBeLessThan(50)
  })

  it('keeps the Falkland Islands on the Americas map', () => {
    const features = continentFeatures(topology, countries, 'Americas')
    expect(features.some((item) => item.properties.country.cca3 === 'FLK')).toBe(true)
  })

  it('draws a path for each clipped country', () => {
    const shapes = projectContinent(topology, countries, 'Africa', 800, 480)
    expect(shapes.length).toBeGreaterThan(20)
    expect(shapes.every((shape) => shape.d.length > 0)).toBe(true)
  })
})
