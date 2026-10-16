import { useMemo } from 'react'
import { projectContinent } from '../domain/mapGeometry'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'

interface ContinentOutlineProps {
  topology: Topology
  countries: readonly Country[]
  continent: string
}

export function ContinentOutline({ topology, countries, continent }: ContinentOutlineProps) {
  const contour = useMemo(
    () => projectContinent(topology, countries, continent, 160, 112).map((shape) => shape.d).join(' '),
    [topology, countries, continent],
  )
  return (
    <svg viewBox="0 0 160 112" className="h-24 w-32 shrink-0" aria-hidden>
      <rect width="160" height="112" rx="18" className="fill-[#d5ebe4]" />
      {contour && (
        <path d={contour} className="fill-[#1f7a72] stroke-[#0e4d4a]" strokeWidth="1.6" strokeLinejoin="round" />
      )}
    </svg>
  )
}
