import { LocateFixed, Minus, Plus } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react'
import { chartPlateSrc } from '../domain/chartPlates'
import { mapLabelVisible, projectChartDecor, type MapFocus } from '../domain/mapGeometry'
import { clampPan, frameBounds, panBy, pinchZoom, resetView, viewWindow, zoomAt, type MapView, type PinchSample } from '../domain/mapZoom'
import type { MapSkin, OrnamentTone } from '../domain/mapSkin'
import { useMapProjection } from '../hooks/useMapProjection'
import { ChartOrnaments } from './ChartOrnaments'
import type { PinMark } from '../hooks/useQuizEngine'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'
import { FlagMark } from './FlagMark'

interface MapViewerProps {
  topology: Topology
  countries: readonly Country[]
  continent: string
  target: Country
  pinMark: PinMark
  picked: string | null
  onPick: (cca3: string) => void
  skin?: MapSkin
  hidePrompt?: boolean
  focus?: MapFocus
  ornaments?: OrnamentTone
  frameCompass?: boolean
  showFlag?: boolean
  /** Set while studying. Null keeps the whole continent. A code highlights that country and frames it. */
  frameCca3?: string | null
  showLabels?: boolean
}

export function MapViewer({
  topology,
  countries,
  continent,
  target,
  pinMark,
  picked,
  onPick,
  skin = 'plain',
  hidePrompt = false,
  focus,
  ornaments = 'none',
  frameCompass = false,
  showFlag = true,
  frameCca3,
  showLabels = false,
}: MapViewerProps) {
  const paperId = `paper-${useId().replaceAll(':', '')}`
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; originX: number; originY: number; panning: boolean } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<PinchSample | null>(null)
  const pinching = useRef(false)
  const [size, setSize] = useState({ width: 640, height: 420 })
  const [view, setView] = useState<MapView>(resetView)
  const shapes = useMapProjection(topology, countries, continent, size.width, size.height, focus)
  const decor = useMemo(
    () =>
      ornaments === 'none' ? null : projectChartDecor(topology, countries, continent, size.width, size.height, focus),
    [ornaments, topology, countries, continent, size.width, size.height, focus],
  )
  const mapWindow = viewWindow(view, size.width, size.height)
  const aged = skin !== 'plain'
  const land = aged ? 'fill-[#f4e4c4] hover:fill-[#e7c56a]' : 'fill-[#f4f7f1] hover:fill-[#f6d48a]'
  const coast = aged ? 'stroke-[#6a4428]' : 'stroke-[#1c3f38]'

  useEffect(() => {
    if (frameCca3 !== undefined) return
    setView(resetView())
  }, [target.cca3, frameCca3])

  useEffect(() => {
    if (frameCca3 === undefined) return
    if (!frameCca3) {
      setView(resetView())
      return
    }
    const node = frame.current?.querySelector(`path[data-cca3="${frameCca3}"]`)
    if (!(node instanceof SVGGraphicsElement)) return
    const box = node.getBBox()
    setView(frameBounds({ x: box.x, y: box.y, width: box.width, height: box.height }, size.width, size.height))
  }, [frameCca3, size.width, size.height, shapes.length])

  useEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(280, Math.floor(entry.contentRect.width))
      const height = Math.max(280, Math.min(560, Math.floor(width * 0.62)))
      setSize({ width, height })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const node = frame.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const svg = node.querySelector('svg')
      const rect = (svg ?? node).getBoundingClientRect()
      const px = ((event.clientX - rect.left) / rect.width) * size.width
      const py = ((event.clientY - rect.top) / rect.height) * size.height
      const factor = event.deltaY < 0 ? 1.25 : 0.8
      setView((current) => clampPan(zoomAt(current, px, py, factor), size.width, size.height))
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [size.width, size.height])

  function zoomBy(factor: number) {
    setView((current) => clampPan(zoomAt(current, size.width / 2, size.height / 2, factor), size.width, size.height))
  }

  function localPoint(clientX: number, clientY: number, rect: DOMRect) {
    return {
      x: ((clientX - rect.left) / rect.width) * size.width,
      y: ((clientY - rect.top) / rect.height) * size.height,
    }
  }

  function pinchSample(rect: DOMRect): PinchSample | null {
    const points = [...pointers.current.values()]
    if (points.length < 2) return null
    const [first, second] = points
    const start = localPoint(first.x, first.y, rect)
    const end = localPoint(second.x, second.y, rect)
    return {
      distance: Math.hypot(end.x - start.x, end.y - start.y),
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const rect = event.currentTarget.getBoundingClientRect()
    if (pointers.current.size >= 2) {
      const next = pinchSample(rect)
      const previous = pinch.current
      if (next && previous) {
        setView((current) => clampPan(pinchZoom(current, previous, next), size.width, size.height))
      }
      pinch.current = next
      pinching.current = true
      drag.current = null
      return
    }
    if (pinching.current) return
    const start = drag.current
    if (!start) return
    if (!start.panning) {
      const distance = Math.hypot(event.clientX - start.originX, event.clientY - start.originY)
      if (distance < 8) return
      start.panning = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const dx = ((event.clientX - start.x) / rect.width) * size.width
    const dy = ((event.clientY - start.y) / rect.height) * size.height
    start.x = event.clientX
    start.y = event.clientY
    setView((current) => clampPan(panBy(current, dx, dy), size.width, size.height))
  }

  function countryAt(clientX: number, clientY: number): string | undefined {
    const svg = frame.current?.querySelector('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const win = viewWindow(view, size.width, size.height)
    const point = new DOMPoint(
      win.x + ((clientX - rect.left) / rect.width) * win.width,
      win.y + ((clientY - rect.top) / rect.height) * win.height,
    )
    let best: { cca3: string; area: number } | undefined
    for (const path of svg.querySelectorAll('path')) {
      if (!path.isPointInFill(point)) continue
      const box = path.getBBox()
      const area = box.width * box.height
      const cca3 = path.dataset.cca3
      if (!cca3) continue
      if (!best || area < best.area) best = { cca3, area }
    }
    return best?.cca3
  }

  function releasePointer(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    const wasPinch = pinching.current
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) pinching.current = false
    const start = drag.current
    drag.current = null
    if (wasPinch || !start || start.panning) return
    const cca3 = countryAt(event.clientX, event.clientY)
    if (cca3) onPick(cca3)
  }

  function beginPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('button')) return
    event.preventDefault()
    window.getSelection()?.removeAllRanges()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size >= 2) {
      drag.current = null
      pinching.current = true
      for (const id of pointers.current.keys()) event.currentTarget.setPointerCapture(id)
      pinch.current = pinchSample(event.currentTarget.getBoundingClientRect())
      return
    }
    drag.current = { x: event.clientX, y: event.clientY, originX: event.clientX, originY: event.clientY, panning: false }
  }

  return (
    <section className="grid gap-4">
      {hidePrompt ? null : (
        <p className="flex items-center gap-3 font-display text-3xl text-ink sm:text-4xl">
          {showFlag && <FlagMark cca2={target.cca2} className="h-8 w-12 rounded shadow-sm" />}
          Find {target.name.common}
        </p>
      )}
      <div
        ref={frame}
        className={`relative touch-none overflow-hidden rounded-3xl shadow-inner select-none ${aged ? 'bg-[#d7c7a3] shadow-[inset_0_0_48px_rgba(90,60,20,0.28)]' : 'bg-[#d5ebe4]'}`}
        onPointerDown={beginPointer}
        onPointerMove={movePointer}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
      >
        <svg
          viewBox={`${mapWindow.x} ${mapWindow.y} ${mapWindow.width} ${mapWindow.height}`}
          className="h-auto w-full cursor-grab overflow-hidden"
          role="img"
          aria-label={`${continent} map`}
        >
          {aged && (
            <filter id={paperId}>
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
            </filter>
          )}
          {decor && <ChartOrnaments decor={decor} scale={view.scale} layer="grid" tone={ornaments} />}
          {shapes.map((shape) => {
            const revealed = pinMark === 'reveal' && shape.cca3 === target.cca3
            const correct = pinMark === 'correct' && shape.cca3 === target.cca3
            const focused = frameCca3 != null && shape.cca3 === frameCca3
            const wrong = pinMark === 'wrong' && shape.cca3 === picked
            const tone = correct || revealed || focused ? 'fill-[#2f8f55]' : wrong ? 'fill-[#d4533a]' : land
            return (
              <path
                key={shape.cca3}
                d={shape.d}
                data-cca3={shape.cca3}
                className={`${tone} ${coast}`}
                pointerEvents="fill"
                strokeWidth={0.8 / view.scale}
              >
                <title>{shape.name}</title>
              </path>
            )
          })}
          {showLabels &&
            shapes.map((shape) => {
              if (!mapLabelVisible(shape.area, view.scale) && shape.cca3 !== frameCca3) return null
              const focused = frameCca3 != null && shape.cca3 === frameCca3
              return (
                <text
                  key={`label-${shape.cca3}`}
                  x={shape.labelX}
                  y={shape.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  className={focused ? 'fill-white' : 'fill-[#1c3f38]'}
                  style={{ fontSize: 11 / view.scale, fontWeight: 600, paintOrder: 'stroke', stroke: focused ? '#1c3f38' : '#f4f7f1', strokeWidth: 2.5 / view.scale, userSelect: 'none' }}
                >
                  {shape.name}
                </text>
              )
            })}
          {aged && (
            <rect
              x={mapWindow.x}
              y={mapWindow.y}
              width={mapWindow.width}
              height={mapWindow.height}
              filter={`url(#${paperId})`}
              opacity="0.18"
              pointerEvents="none"
            />
          )}
          {decor && (
            <ChartOrnaments
              decor={decor}
              scale={view.scale}
              layer="marks"
              tone={ornaments}
              corner={{ x: mapWindow.x + 10 / view.scale, y: mapWindow.y + 10 / view.scale }}
            />
          )}
        </svg>
        {frameCompass && (
          <img src={chartPlateSrc('compass')} alt="" className="pointer-events-none absolute top-3 left-3 h-14 w-14" />
        )}
        <div className="absolute right-3 bottom-3 flex gap-2">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.4)} className="rounded-full bg-white p-2 text-tide shadow">
            <Plus className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.4)} className="rounded-full bg-white p-2 text-tide shadow">
            <Minus className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Reset view" onClick={() => setView(resetView())} className="rounded-full bg-white p-2 text-tide shadow">
            <LocateFixed className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <p className="text-sm text-tide">Pinch or scroll to zoom, drag to move.</p>
    </section>
  )
}
