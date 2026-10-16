import { useEffect, useMemo, useRef, useState } from 'react'
import { loadAnswerLog, recordAnswer, saveAnswerLog } from '../domain/answerLog'
import { continentFeatures } from '../domain/mapGeometry'
import { loadProgress, mergeResult, saveProgress, type ProgressFile } from '../domain/progress'
import { mulberry32 } from '../domain/random'
import { samplePinpoint } from '../domain/rounds'
import { accuracyOf, applyAnswer, emptyScore, type ScoreState } from '../domain/scoring'
import { buildTriviaRound, type TriviaQuestion } from '../domain/trivia'
import type { Country } from '../types/country'
import type { Topology } from 'topojson-specification'

const PIN_SECONDS = 25
const TRIVIA_SECONDS = 20

export type Stage = 'pinpoint' | 'trivia' | 'results'
export type PinMark = 'idle' | 'correct' | 'wrong' | 'reveal'

interface EngineInput {
  continent: string
  countries: readonly Country[]
  topology: Topology
}

export function useQuizEngine({ continent, countries, topology }: EngineInput) {
  const round = useMemo(() => {
    const onMap = continentFeatures(topology, countries, continent).map((item) => item.properties.country)
    const rng = mulberry32(Math.floor(Math.random() * 1_000_000_000))
    const here = countries.filter((country) => country.continent === continent)
    const log = loadAnswerLog()
    return { pinpoint: samplePinpoint(onMap, rng, log), trivia: buildTriviaRound(here, rng, log) }
  }, [continent, countries, topology])

  const [stage, setStage] = useState<Stage>('pinpoint')
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState<ScoreState>(emptyScore)
  const [pinMark, setPinMark] = useState<PinMark>('idle')
  const [picked, setPicked] = useState<string | null>(null)
  const [triviaPick, setTriviaPick] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(PIN_SECONDS)
  const [progress, setProgress] = useState<ProgressFile>(() => loadProgress())
  const settled = useRef(false)

  const currentPin = round.pinpoint[index]
  const currentTrivia = round.trivia[index]
  const limit = stage === 'pinpoint' ? PIN_SECONDS : TRIVIA_SECONDS

  function settle(correct: boolean, then: () => void) {
    if (settled.current || stage === 'results') return
    settled.current = true
    setScore((prev) => applyAnswer(prev, correct))
    window.setTimeout(then, correct ? 700 : 1200)
  }

  function remember(kind: string, correct: boolean) {
    saveAnswerLog(recordAnswer(loadAnswerLog(), kind, correct))
  }

  function goPin(correct: boolean, pickedCode: string, reveal: boolean) {
    remember('pinpoint', correct)
    setPicked(pickedCode)
    setPinMark(correct ? 'correct' : 'wrong')
    if (reveal) window.setTimeout(() => setPinMark('reveal'), 450)
    settle(correct, () => {
      setPinMark('idle')
      setPicked(null)
      if (index + 1 >= round.pinpoint.length) {
        setStage('trivia')
        setIndex(0)
        return
      }
      setIndex((value) => value + 1)
    })
  }

  function goTrivia(choiceId: string, correct: boolean) {
    if (currentTrivia) remember(currentTrivia.kind, correct)
    setTriviaPick(choiceId)
    settle(correct, () => {
      setTriviaPick(null)
      if (index + 1 >= round.trivia.length) {
        setStage('results')
        return
      }
      setIndex((value) => value + 1)
    })
  }

  useEffect(() => {
    if (stage === 'results') return
    settled.current = false
    setSecondsLeft(limit)
    const started = Date.now()
    const timer = window.setInterval(() => {
      const left = Math.max(0, limit - Math.floor((Date.now() - started) / 1000))
      setSecondsLeft(left)
      if (left > 0 || settled.current) return
      if (stage === 'pinpoint' && currentPin) goPin(false, currentPin.cca3, true)
      if (stage === 'trivia' && currentTrivia) goTrivia('__timeout__', false)
    }, 200)
    return () => window.clearInterval(timer)
  }, [stage, index, limit, currentPin, currentTrivia])

  useEffect(() => {
    if (stage !== 'results') return
    setProgress((prev) => {
      const next = mergeResult(prev, continent, score)
      saveProgress(next)
      return next
    })
  }, [stage, continent, score])

  return {
    stage,
    index,
    total: stage === 'trivia' ? round.trivia.length : round.pinpoint.length,
    score,
    accuracy: accuracyOf(score),
    pinMark,
    picked,
    triviaPick,
    secondsLeft,
    secondsLimit: limit,
    currentPin,
    currentTrivia: currentTrivia as TriviaQuestion | undefined,
    progress,
    pickCountry: (cca3: string) => {
      if (stage !== 'pinpoint' || !currentPin || settled.current) return
      goPin(cca3 === currentPin.cca3, cca3, cca3 !== currentPin.cca3)
    },
    pickTrivia: (choiceId: string) => {
      if (stage !== 'trivia' || !currentTrivia || settled.current) return
      goTrivia(choiceId, choiceId === currentTrivia.correctId)
    },
  }
}
