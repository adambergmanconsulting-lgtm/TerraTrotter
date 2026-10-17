export function chartPlateSrc(name: string) {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}charts/${name}-olaus.png`
}
