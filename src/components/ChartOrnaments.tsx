import { chartPlateSrc } from '../domain/chartPlates'
import type { ChartBeast, ChartBeastKind, ChartDecor } from '../domain/mapGeometry'
import type { OrnamentTone } from '../domain/mapSkin'

const ink = '#6a4428'

const PLATES: Record<ChartBeastKind, { width: number; height: number }> = {
  kraken: { width: 42, height: 32 },
  swine: { width: 52, height: 30 },
  serpent: { width: 52, height: 30 },
  whale: { width: 52, height: 30 },
}

function plateSrc(kind: ChartBeastKind) {
  return chartPlateSrc(kind)
}

function Beast({ beast, tone }: { beast: ChartBeast; tone: OrnamentTone }) {
  const plate = PLATES[beast.kind]
  const scale = tone === 'quiet' ? 0.72 : 1
  const width = plate.width * scale
  const height = plate.height * scale
  return (
    <g transform={`translate(${beast.x} ${beast.y})`}>
      <image
        href={plateSrc(beast.kind)}
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        style={tone === 'quiet' ? { filter: 'grayscale(1)', opacity: 0.82 } : undefined}
      />
      {tone === 'full' && (
        <text y={height / 2 + 6} textAnchor="middle" fill={ink} fontSize="5" fontFamily="Georgia, serif">
          {beast.label}
        </text>
      )}
    </g>
  )
}

export function ChartOrnaments({
  decor,
  scale,
  layer,
  tone = 'full',
  corner,
}: {
  decor: ChartDecor
  scale: number
  layer: 'grid' | 'marks'
  tone?: OrnamentTone
  corner?: { x: number; y: number }
}) {
  if (layer === 'grid') {
    if (tone !== 'full') return null
    return (
      <path d={decor.graticule} fill="none" stroke={ink} strokeOpacity={0.28} strokeWidth={0.6 / scale} pointerEvents="none" />
    )
  }
  return (
    <g pointerEvents="none" aria-hidden>
      {tone === 'full' && corner && (
        <image
          href={chartPlateSrc('compass')}
          x={corner.x}
          y={corner.y}
          width={48 / scale}
          height={48 / scale}
        />
      )}
      {decor.beasts.map((beast) => (
        <Beast key={beast.kind} beast={beast} tone={tone} />
      ))}
    </g>
  )
}
