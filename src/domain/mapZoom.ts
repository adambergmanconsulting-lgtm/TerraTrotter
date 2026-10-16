export interface MapView {
  x: number
  y: number
  scale: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 24

export function resetView(): MapView {
  return { x: 0, y: 0, scale: 1 }
}

export function zoomAt(view: MapView, px: number, py: number, factor: number): MapView {
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.scale * factor))
  if (scale === MIN_ZOOM) return resetView()
  const worldX = (px - view.x) / view.scale
  const worldY = (py - view.y) / view.scale
  return { scale, x: px - worldX * scale, y: py - worldY * scale }
}

export function viewWindow(view: MapView, width: number, height: number) {
  return {
    x: -view.x / view.scale,
    y: -view.y / view.scale,
    width: width / view.scale,
    height: height / view.scale,
  }
}

export interface PinchSample {
  distance: number
  x: number
  y: number
}

/** Zoom from the change in distance between two fingers, then follow their midpoint. */
export function pinchZoom(view: MapView, previous: PinchSample, next: PinchSample): MapView {
  if (previous.distance < 8 || next.distance < 8) return view
  const zoomed = zoomAt(view, previous.x, previous.y, next.distance / previous.distance)
  return panBy(zoomed, next.x - previous.x, next.y - previous.y)
}

export function panBy(view: MapView, dx: number, dy: number): MapView {
  if (view.scale <= MIN_ZOOM) return view
  return { ...view, x: view.x + dx, y: view.y + dy }
}

export function clampPan(view: MapView, width: number, height: number): MapView {
  if (view.scale <= MIN_ZOOM) return resetView()
  const margin = 48
  return {
    scale: view.scale,
    x: Math.min(width - margin, Math.max(margin - width * view.scale, view.x)),
    y: Math.min(height - margin, Math.max(margin - height * view.scale, view.y)),
  }
}
