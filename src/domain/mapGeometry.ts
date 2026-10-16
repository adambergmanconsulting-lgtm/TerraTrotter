import { geoCentroid, geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import type { Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Country } from '../types/country'

export interface MapShape {
  cca3: string
  ccn3: string
  name: string
  d: string
}

interface Box {
  west: number
  east: number
  south: number
  north: number
}

/** Keep the part of a country that sits on its continent, so overseas polygons do not zoom the map out. */
const CONTINENT_BOXES: Record<string, Box[]> = {
  Africa: [{ west: -25, east: 58, south: -36, north: 38 }],
  Europe: [{ west: -28, east: 45, south: 33, north: 73 }],
  Asia: [{ west: 26, east: 180, south: -12, north: 78 }],
  Americas: [{ west: -170, east: -28, south: -56, north: 84 }],
  Oceania: [
    { west: 110, east: 180, south: -50, north: 28 },
    { west: -180, east: -128, south: -50, north: 28 },
  ],
}

function inBoxes(lon: number, lat: number, boxes: Box[]): boolean {
  return boxes.some((box) => lon >= box.west && lon <= box.east && lat >= box.south && lat <= box.north)
}

function centroidOf(geometry: Geometry): [number, number] {
  return geoCentroid({ type: 'Feature', properties: {}, geometry })
}

function clipGeometry(geometry: Geometry, boxes: Box[]): Geometry | null {
  if (geometry.type === 'Polygon') {
    const [lon, lat] = centroidOf(geometry)
    return inBoxes(lon, lat, boxes) ? geometry : null
  }
  if (geometry.type !== 'MultiPolygon') return null
  const coordinates = geometry.coordinates.filter((polygon) => {
    const [lon, lat] = centroidOf({ type: 'Polygon', coordinates: polygon })
    return inBoxes(lon, lat, boxes)
  })
  if (coordinates.length === 0) return null
  return { type: 'MultiPolygon', coordinates }
}

interface KeptFeature {
  type: 'Feature'
  properties: { country: Country }
  geometry: Geometry
}

export function continentFeatures(
  topology: Topology,
  countries: readonly Country[],
  continent: string,
): KeptFeature[] {
  const boxes = CONTINENT_BOXES[continent]
  if (!boxes) return []
  const byCode = new Map(
    countries.filter((country) => country.continent === continent).map((country) => [country.ccn3, country]),
  )
  const collection = topology.objects.countries as GeometryCollection
  const polygons = feature(topology, collection)
  return polygons.features.flatMap((item) => {
    const ccn3 = String(item.id ?? '').padStart(3, '0')
    const country = byCode.get(ccn3)
    if (!country || !item.geometry) return []
    const geometry = clipGeometry(item.geometry, boxes)
    if (!geometry) return []
    return [{ type: 'Feature' as const, properties: { country }, geometry }]
  })
}

export function projectContinent(
  topology: Topology,
  countries: readonly Country[],
  continent: string,
  width: number,
  height: number,
): MapShape[] {
  const kept = continentFeatures(topology, countries, continent)
  if (kept.length === 0) return []
  const projection = geoMercator().fitExtent(
    [
      [16, 16],
      [width - 16, height - 16],
    ],
    { type: 'FeatureCollection', features: kept },
  )
  const path = geoPath(projection)
  return kept
    .flatMap((item) => {
      const d = path(item as GeoPermissibleObjects)
      if (!d) return []
      return [{ shape: item, d, area: Math.abs(path.area(item as GeoPermissibleObjects)) }]
    })
    .sort((a, b) => b.area - a.area)
    .map(({ shape, d }) => ({
      cca3: shape.properties.country.cca3,
      ccn3: shape.properties.country.ccn3,
      name: shape.properties.country.name.common,
      d,
    }))
}
