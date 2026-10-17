import { describe, expect, it } from 'vitest'
import { clampPan, frameBounds, pinchZoom, resetView, viewWindow, zoomAt } from './mapZoom'

describe('zoomAt', () => {
  it('keeps the point under the cursor fixed while zooming in', () => {
    const start = resetView()
    const next = zoomAt(start, 100, 80, 2)
    const worldBefore = { x: 100, y: 80 }
    const worldAfter = { x: (100 - next.x) / next.scale, y: (80 - next.y) / next.scale }
    expect(next.scale).toBe(2)
    expect(worldAfter.x).toBeCloseTo(worldBefore.x)
    expect(worldAfter.y).toBeCloseTo(worldBefore.y)
  })

  it('returns to the full continent at the minimum zoom', () => {
    const zoomed = zoomAt(resetView(), 40, 40, 4)
    expect(zoomAt(zoomed, 40, 40, 0.1)).toEqual(resetView())
  })

  it('shows the same map point under the cursor in the view window', () => {
    const view = zoomAt(resetView(), 100, 80, 2)
    const window = viewWindow(view, 800, 500)
    const localX = window.x + (100 / 800) * window.width
    const localY = window.y + (80 / 500) * window.height
    expect(localX).toBeCloseTo((100 - view.x) / view.scale)
    expect(localY).toBeCloseTo((80 - view.y) / view.scale)
  })

  it('keeps the pinch midpoint on the same map point while the fingers spread', () => {
    const next = pinchZoom(resetView(), { distance: 100, x: 200, y: 150 }, { distance: 200, x: 220, y: 160 })
    expect(next.scale).toBe(2)
    expect((220 - next.x) / next.scale).toBeCloseTo(200)
    expect((160 - next.y) / next.scale).toBeCloseTo(150)
  })

  it('frames a country box inside the window', () => {
    const box = { x: 100, y: 80, width: 40, height: 20 }
    const view = frameBounds(box, 800, 500)
    const window = viewWindow(view, 800, 500)
    expect(view.scale).toBeGreaterThan(1)
    expect(window.x).toBeLessThan(box.x)
    expect(window.y).toBeLessThan(box.y)
    expect(window.x + window.width).toBeGreaterThan(box.x + box.width)
    expect(window.y + window.height).toBeGreaterThan(box.y + box.height)
  })

  it('does not pan the unzoomed map off the frame', () => {
    expect(clampPan({ x: 500, y: -200, scale: 1 }, 800, 480)).toEqual(resetView())
  })
})
