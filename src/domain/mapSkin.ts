export type MapSkin = 'plain' | 'parchment' | 'chart'

export type OrnamentTone = 'none' | 'quiet' | 'full'

export const MAP_SKINS: { id: MapSkin; title: string; note: string }[] = [
  {
    id: 'plain',
    title: 'Current chart',
    note: 'Cream land and a mint sea. This is the map a round uses. Creatures stay off the sea.',
  },
  {
    id: 'parchment',
    title: 'Ink on parchment',
    note: 'Aged paper, brown ink coasts, and a washed sea. Same country outlines.',
  },
  {
    id: 'chart',
    title: 'Here be monsters',
    note: 'Woodcuts from Olaus Magnus: a kraken, the sea swine, the Norway serpent, and the great whale.',
  },
]
