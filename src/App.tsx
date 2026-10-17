import { useEffect, useState } from 'react'
import { ContinentSelector } from './components/ContinentSelector'
import { MapStyleGallery } from './components/MapStyleGallery'
import { MapViewer } from './components/MapViewer'
import { QuizCard } from './components/QuizCard'
import { ResultsModal } from './components/ResultsModal'
import { StudyMap } from './components/StudyMap'
import { ScoreBar } from './components/ScoreBar'
import { showDesignPreview } from './domain/designPreview'
import { DIFFICULTY_LABEL, showMapFlag, type Difficulty } from './domain/difficulty'
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
  difficulty,
  pack,
  onExit,
  onAgain,
}: {
  continent: string
  difficulty: Difficulty
  pack: Pack
  onExit: () => void
  onAgain: () => void
}) {
  const round = useQuizEngine({ continent, difficulty, countries: pack.countries, topology: pack.topology })
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6">
      <ScoreBar
        continent={continent}
        difficultyLabel={DIFFICULTY_LABEL[difficulty]}
        stage={round.stage}
        index={round.index}
        total={round.total}
        score={round.score}
        elapsed={round.elapsed}
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
          frameCompass
          showFlag={showMapFlag(difficulty)}
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
          bestScore={round.progress.levels[difficulty][continent]?.bestScore ?? round.score.score}
          bestSeconds={round.progress.levels[difficulty][continent]?.bestSeconds}
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
  const [study, setStudy] = useState<string | null>(null)
  const [playId, setPlayId] = useState(0)
  const [homeProgress, setHomeProgress] = useState(() => loadProgress())
  const [difficulty, setDifficulty] = useState<Difficulty>(() =>
    Object.keys(loadProgress().levels.medium).length > 0 ? 'medium' : 'easy',
  )
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const sync = () => setHash(window.location.hash)
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

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
  if (hash === '#/design' && showDesignPreview()) {
    return <MapStyleGallery countries={pack.countries} topology={pack.topology} />
  }
  if (study) {
    return <StudyMap continent={study} countries={pack.countries} topology={pack.topology} onExit={() => setStudy(null)} />
  }
  if (!continent) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <ContinentSelector
          levels={homeProgress.levels}
          difficulty={difficulty}
          bestStreak={homeProgress.bestStreak}
          countries={pack.countries}
          topology={pack.topology}
          onDifficulty={setDifficulty}
          onChoose={(name) => {
            setHomeProgress(loadProgress())
            setContinent(name)
          }}
          onStudy={setStudy}
        />
      </main>
    )
  }
  return (
    <Round
      key={`${continent}-${difficulty}-${playId}`}
      continent={continent}
      difficulty={difficulty}
      pack={pack}
      onExit={() => {
        setHomeProgress(loadProgress())
        setContinent(null)
      }}
      onAgain={() => setPlayId((value) => value + 1)}
    />
  )
}
