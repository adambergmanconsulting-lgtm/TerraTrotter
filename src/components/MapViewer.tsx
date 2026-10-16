import { LocateFixed, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { clampPan, panBy, resetView, viewWindow, zoomAt, type MapView } from '../domain/mapZoom'
import { useMapProjection } from '../hooks/useMapProjection'
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
}

export function MapViewer({ topology, countries, continent, target, pinMark, picked, onPick }: MapViewerProps) {
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; originX: number; originY: number; panning: boolean } | null>(null)
  const [size, setSize] = useState({ width: 640, height: 420 })
  const [view, setView] = useState<MapView>(resetView)
  const shapes = useMapProjection(topology, countries, continent, size.width, size.height)
  const mapWindow = viewWindow(view, size.width, size.height)

  useEffect(() => {
    setView(resetView())
  }, [target.cca3])

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

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start) return
    if (!start.panning) {
      const distance = Math.hypot(event.clientX - start.originX, event.clientY - start.originY)
      if (distance < 8) return
      start.panning = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const rect = event.currentTarget.getBoundingClientRect()
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
    const start = drag.current
    drag.current = null
    if (!start || start.panning) return
    const cca3 = countryAt(event.clientX, event.clientY)
    if (cca3) onPick(cca3)
  }

  return (
    <section className="grid gap-4">
      <p className="flex items-center gap-3 font-display text-3xl text-ink sm:text-4xl">
        <FlagMark cca2={target.cca2} className="h-8 w-12 rounded shadow-sm" />
        Find {target.name.common}
      </p>
      <div
        ref={frame}
        className="relative touch-none overflow-hidden rounded-3xl bg-[#d5ebe4] shadow-inner"
        onPointerDown={(event) => {
          if (event.button !== 0) return
          if (event.target instanceof Element && event.target.closest('button')) return
          drag.current = { x: event.clientX, y: event.clientY, originX: event.clientX, originY: event.clientY, panning: false }
        }}
        onPointerMove={movePointer}
        onPointerUp={releasePointer}
      >
        <svg
          viewBox={`${mapWindow.x} ${mapWindow.y} ${mapWindow.width} ${mapWindow.height}`}
          className="h-auto w-full cursor-grab overflow-hidden"
          role="img"
          aria-label={`${continent} map`}
        >
          {shapes.map((shape) => {
            const revealed = pinMark === 'reveal' && shape.cca3 === target.cca3
            const correct = pinMark === 'correct' && shape.cca3 === target.cca3
            const wrong = pinMark === 'wrong' && shape.cca3 === picked
            const tone = correct || revealed ? 'fill-[#2f8f55]' : wrong ? 'fill-[#d4533a]' : 'fill-[#f4f7f1] hover:fill-[#f6d48a]'
            return (
              <path
                key={shape.cca3}
                d={shape.d}
                data-cca3={shape.cca3}
                className={`${tone} stroke-[#1c3f38]`}
                pointerEvents="fill"
                strokeWidth={0.8 / view.scale}
              >
                <title>{shape.name}</title>
              </path>
            )
          })}
        </svg>
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
      <p className="text-sm text-tide">Scroll to zoom, drag to move.</p>
    </section>
  )
}
