import { geoBounds, geoCentroid, geoContains, geoGraticule, geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import type { Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Country } from '../types/country'

export interface MapShape {
  cca3: string
  ccn3: string
  name: string
  d: string
  labelX: number
  labelY: number
  area: number
}

/** True when a country is large enough on screen for a readable name. */
export function mapLabelVisible(area: number, scale: number, minScreen = 1_200): boolean {
  return area * scale * scale >= minScreen
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

/** Russia is quizzed as Europe. The land east of the Urals is drawn on the Asia map. */
const URALS = 60

function clipBoxes(continent: string, country: Country): Box[] {
  const boxes = CONTINENT_BOXES[continent]
  if (country.cca3 !== 'RUS') return boxes
  if (continent === 'Asia') return [{ west: URALS, east: 180, south: -12, north: 82 }]
  return boxes.map((box) => ({ ...box, east: URALS }))
}

function inBoxes(lon: number, lat: number, boxes: Box[]): boolean {
  return boxes.some((box) => lon >= box.west && lon <= box.east && lat >= box.south && lat <= box.north)
}

function centroidOf(geometry: Geometry): [number, number] {
  return geoCentroid({ type: 'Feature', properties: {}, geometry })
}

type LonLat = [number, number]

function degreeDistance(a: LonLat, b: LonLat): number {
  const mid = ((a[1] + b[1]) / 2) * (Math.PI / 180)
  return Math.hypot((a[0] - b[0]) * Math.cos(mid), a[1] - b[1])
}

function boundarySamples(geometry: Geometry): LonLat[] {
  const rings =
    geometry.type === 'Polygon'
      ? geometry.coordinates
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates.flat()
        : []
  const vertices = rings.flat() as LonLat[]
  const step = Math.max(1, Math.floor(vertices.length / 80))
  return vertices.filter((_, index) => index % step === 0)
}

/** Center of the country when that point is on land. Otherwise the interior point nearest that center with room for a name. */
export function labelSite(feature: GeoPermissibleObjects): LonLat {
  const center = geoCentroid(feature)
  if (geoContains(feature, center)) return center
  const geometry = (feature as { geometry?: Geometry }).geometry
  if (!geometry) return center
  const samples = boundarySamples(geometry)
  if (samples.length === 0) return center
  const [[west, south], [east, north]] = geoBounds(feature)
  const steps = 22
  const inside: { point: LonLat; clearance: number; fromCenter: number }[] = []
  for (let i = 0; i <= steps; i += 1) {
    for (let j = 0; j <= steps; j += 1) {
      const point: LonLat = [west + ((east - west) * i) / steps, south + ((north - south) * j) / steps]
      if (!geoContains(feature, point)) continue
      let clearance = Infinity
      for (const vertex of samples) clearance = Math.min(clearance, degreeDistance(point, vertex))
      inside.push({ point, clearance, fromCenter: degreeDistance(point, center) })
    }
  }
  if (inside.length === 0) return center
  const room = Math.max(...inside.map((item) => item.clearance)) * 0.45
  const roomy = inside.filter((item) => item.clearance >= room)
  return roomy.reduce((best, item) => (item.fromCenter < best.fromCenter ? item : best)).point
}

/** Keep one side of the 60°E meridian. The Urals are the continental boundary used on these maps. */
function clipRingAtUrals(ring: number[][], keepEast: boolean): number[][] | null {
  const inside = (lon: number) => (keepEast ? lon >= URALS : lon <= URALS)
  const cross = (from: number[], to: number[]) => {
    const t = (URALS - from[0]) / (to[0] - from[0])
    return [URALS, from[1] + t * (to[1] - from[1])]
  }
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
  const open = closed ? ring.slice(0, -1) : ring
  if (open.length < 3) return null
  const output: number[][] = []
  let previous = open[open.length - 1]
  for (const point of open) {
    const previousInside = inside(previous[0])
    const pointInside = inside(point[0])
    if (pointInside !== previousInside && point[0] !== previous[0]) output.push(cross(previous, point))
    if (pointInside) output.push([point[0], point[1]])
    previous = point
  }
  if (output.length < 3) return null
  output.push([output[0][0], output[0][1]])
  return output
}

function clipToUrals(geometry: Geometry, keepEast: boolean): Geometry | null {
  const clipPolygon = (polygon: number[][][]) => {
    const outer = clipRingAtUrals(polygon[0] ?? [], keepEast)
    if (!outer) return null
    const holes = polygon.slice(1).flatMap((ring) => {
      const clipped = clipRingAtUrals(ring, keepEast)
      return clipped ? [clipped] : []
    })
    return [outer, ...holes]
  }
  if (geometry.type === 'Polygon') {
    const coordinates = clipPolygon(geometry.coordinates)
    return coordinates ? { type: 'Polygon', coordinates } : null
  }
  if (geometry.type !== 'MultiPolygon') return null
  const coordinates = geometry.coordinates.flatMap((polygon) => {
    const clipped = clipPolygon(polygon)
    return clipped ? [clipped] : []
  })
  return coordinates.length > 0 ? { type: 'MultiPolygon', coordinates } : null
}

/** Drop the Chukotka coast that sits past the date line. Shifting it wraps back to the far side of the map and cuts Siberia out of the fill. */
function stayWestOfDateLine(geometry: Geometry): Geometry | null {
  const cleanRing = (ring: number[][]) => ring.filter(([lon]) => lon >= 0)
  const cleanPolygon = (polygon: number[][][]) => {
    const rings = polygon.map(cleanRing).filter((ring) => ring.length >= 4)
    return rings.length > 0 ? rings : null
  }
  if (geometry.type === 'Polygon') {
    const coordinates = cleanPolygon(geometry.coordinates)
    return coordinates ? { type: 'Polygon', coordinates } : null
  }
  if (geometry.type !== 'MultiPolygon') return null
  const coordinates = geometry.coordinates.flatMap((polygon) => {
    const cleaned = cleanPolygon(polygon)
    return cleaned ? [cleaned] : []
  })
  return coordinates.length > 0 ? { type: 'MultiPolygon', coordinates } : null
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
  const byCode = new Map(countries.map((country) => [country.ccn3, country]))
  const collection = topology.objects.countries as GeometryCollection
  const polygons = feature(topology, collection)
  return polygons.features.flatMap((item) => {
    const ccn3 = String(item.id ?? '').padStart(3, '0')
    const country = byCode.get(ccn3)
    if (!country || !item.geometry) return []
    const onThisMap = country.continent === continent || (continent === 'Asia' && country.cca3 === 'RUS')
    if (!onThisMap) return []
    let geometry: Geometry | null = item.geometry
    if (country.cca3 === 'RUS') {
      const source = stayWestOfDateLine(item.geometry)
      geometry = source ? clipToUrals(source, continent === 'Asia') : null
    }
    if (!geometry) return []
    geometry = clipGeometry(geometry, clipBoxes(continent, country))
    if (!geometry) return []
    return [{ type: 'Feature' as const, properties: { country }, geometry }]
  })
}

export interface MapFocus {
  west: number
  east: number
  south: number
  north: number
}

/** Iceland to Finland, with the Norwegian Sea and the North Sea. */
export const SCANDINAVIA: MapFocus = { west: -26, east: 32, south: 54, north: 72 }

export interface ChartMark {
  x: number
  y: number
}

export type ChartBeastKind = 'kraken' | 'swine' | 'serpent' | 'whale'

export interface ChartBeast extends ChartMark {
  kind: ChartBeastKind
  label: string
}

export interface ChartDecor {
  graticule: string
  beasts: ChartBeast[]
}

export const SCANDINAVIAN_BEASTS: { kind: ChartBeastKind; label: string; lon: number; lat: number }[] = [
  { kind: 'kraken', label: 'Kraken', lon: 1.2, lat: 66.8 },
  { kind: 'swine', label: 'Sea swine', lon: 3.2, lat: 57 },
  { kind: 'serpent', label: 'Sea serpent', lon: 2.2, lat: 62 },
  { kind: 'whale', label: 'Island whale', lon: -21.5, lat: 60.6 },
]

function fittedPath(
  topology: Topology,
  countries: readonly Country[],
  continent: string,
  width: number,
  height: number,
  focus?: MapFocus,
) {
  const kept = continentFeatures(topology, countries, continent)
  if (kept.length === 0) return null
  const frame = focus
    ? {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [focus.west, focus.south],
              [focus.west, focus.north],
              [focus.east, focus.north],
              [focus.east, focus.south],
              [focus.west, focus.south],
            ],
          ],
        },
      }
    : { type: 'FeatureCollection' as const, features: kept }
  const projection = geoMercator().fitExtent(
    [
      [16, 16],
      [width - 16, height - 16],
    ],
    frame,
  )
  return { kept, projection, path: geoPath(projection) }
}

export function projectContinent(
  topology: Topology,
  countries: readonly Country[],
  continent: string,
  width: number,
  height: number,
  focus?: MapFocus,
): MapShape[] {
  const fitted = fittedPath(topology, countries, continent, width, height, focus)
  if (!fitted) return []
  const { kept, path } = fitted
  return kept
    .flatMap((item) => {
      const d = path(item as GeoPermissibleObjects)
      if (!d) return []
      const area = Math.abs(path.area(item as GeoPermissibleObjects))
      const [lon, lat] = labelSite(item as GeoPermissibleObjects)
      const projected = fitted.projection([lon, lat])
      if (!projected) return []
      const [labelX, labelY] = projected
      if (!Number.isFinite(labelX) || !Number.isFinite(labelY)) return []
      return [{ shape: item, d, area, labelX, labelY }]
    })
    .sort((a, b) => b.area - a.area)
    .map(({ shape, d, area, labelX, labelY }) => ({
      cca3: shape.properties.country.cca3,
      ccn3: shape.properties.country.ccn3,
      name: shape.properties.country.name.common,
      d,
      area,
      labelX,
      labelY,
    }))
}

export function projectChartDecor(
  topology: Topology,
  countries: readonly Country[],
  continent: string,
  width: number,
  height: number,
  focus?: MapFocus,
): ChartDecor | null {
  const fitted = fittedPath(topology, countries, continent, width, height, focus)
  if (!fitted) return null
  const mark = (lon: number, lat: number): ChartMark | null => {
    const point = fitted.projection([lon, lat])
    if (!point) return null
    return { x: point[0], y: point[1] }
  }
  const beasts = focus
    ? SCANDINAVIAN_BEASTS.flatMap((beast) => {
        const point = mark(beast.lon, beast.lat)
        if (!point) return []
        return [{ ...point, kind: beast.kind, label: beast.label }]
      })
    : []
  return {
    graticule: fitted.path(geoGraticule().step([10, 10])()) ?? '',
    beasts,
  }
}
