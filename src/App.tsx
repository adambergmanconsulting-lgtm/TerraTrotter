import { useEffect, useState } from 'react'
import { ContinentSelector } from './components/ContinentSelector'
import { MapViewer } from './components/MapViewer'
import { QuizCard } from './components/QuizCard'
import { ResultsModal } from './components/ResultsModal'
import { ScoreBar } from './components/ScoreBar'
import { loadProgress } from './domain/progress'
import { useQuizEngine } from './hooks/useQuizEngine'
import type { Country } from './types/country'
import type { Topology } from 'topojson-specification'

interface Pack {
  countries: Country[]
  topology: Topology
}

function Round({
  continent,
  pack,
  onExit,
  onAgain,
}: {
  continent: string
  pack: Pack
  onExit: () => void
  onAgain: () => void
}) {
  const round = useQuizEngine({ continent, countries: pack.countries, topology: pack.topology })
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6">
      <ScoreBar
        continent={continent}
        stage={round.stage}
        index={round.index}
        total={round.total}
        score={round.score}
        secondsLeft={round.secondsLeft}
        secondsLimit={round.secondsLimit}
        onExit={onExit}
      />
      {round.stage === 'pinpoint' && round.currentPin && (
        <MapViewer
          topology={pack.topology}
          countries={pack.countries}
          continent={continent}
          target={round.currentPin}
          pinMark={round.pinMark}
          picked={round.picked}
          onPick={round.pickCountry}
        />
      )}
      {round.stage === 'trivia' && round.currentTrivia && (
        <QuizCard question={round.currentTrivia} picked={round.triviaPick} onPick={round.pickTrivia} />
      )}
      {round.stage === 'results' && (
        <ResultsModal
          continent={continent}
          score={round.score}
          accuracy={round.accuracy}
          bestScore={round.progress.continents[continent]?.bestScore ?? round.score.score}
          onAgain={onAgain}
          onHome={onExit}
        />
      )}
    </main>
  )
}

export default function App() {
  const [pack, setPack] = useState<Pack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [continent, setContinent] = useState<string | null>(null)
  const [playId, setPlayId] = useState(0)
  const [homeProgress, setHomeProgress] = useState(() => loadProgress())

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}data/countries.json`).then((response) => response.json()),
      fetch(`${base}data/world-50m.json`).then((response) => response.json()),
    ])
      .then(([countries, topology]: [Country[], Topology]) => setPack({ countries, topology }))
      .catch(() => setError('The map data did not load. Refresh the page.'))
  }, [])

  if (error) {
    return <p className="p-8 text-lg text-ink">{error}</p>
  }
  if (!pack) {
    return <p className="p-8 text-lg text-ink">Loading the atlas…</p>
  }
  if (!continent) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <ContinentSelector
          records={homeProgress.continents}
          bestStreak={homeProgress.bestStreak}
          countries={pack.countries}
          topology={pack.topology}
          onChoose={(name) => {
            setHomeProgress(loadProgress())
            setContinent(name)
          }}
        />
      </main>
    )
  }
  return (
    <Round
      key={`${continent}-${playId}`}
      continent={continent}
      pack={pack}
      onExit={() => {
        setHomeProgress(loadProgress())
        setContinent(null)
      }}
      onAgain={() => setPlayId((value) => value + 1)}
    />
  )
}
