import { useMemo } from 'react'
import { projectContinent, type MapFocus, type MapShape } from '../domain/mapGeometry'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'

export function useMapProjection(
  topology: Topology | null,
  countries: readonly Country[],
  continent: string,
  width: number,
  height: number,
  focus?: MapFocus,
): MapShape[] {
  return useMemo(() => {
    if (!topology || width < 40 || height < 40) return []
    return projectContinent(topology, countries, continent, width, height, focus)
  }, [topology, countries, continent, width, height, focus])
}
