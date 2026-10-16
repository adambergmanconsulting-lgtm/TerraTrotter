import { useMemo } from 'react'
import { projectContinent, type MapShape } from '../domain/mapGeometry'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'

export function useMapProjection(
  topology: Topology | null,
  countries: readonly Country[],
  continent: string,
  width: number,
  height: number,
): MapShape[] {
  return useMemo(() => {
    if (!topology || width < 40 || height < 40) return []
    return projectContinent(topology, countries, continent, width, height)
  }, [topology, countries, continent, width, height])
}
