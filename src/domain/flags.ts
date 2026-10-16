export function flagEmoji(cca2: string): string {
  return [...cca2.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

export function flagSrc(cca2: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}flags/${cca2.toLowerCase()}.svg`
}
