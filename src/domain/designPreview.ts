export function designPreviewEnabled(dev: boolean, hostname: string): boolean {
  if (dev) return true
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

export function showDesignPreview(): boolean {
  return designPreviewEnabled(import.meta.env.DEV, window.location.hostname)
}
