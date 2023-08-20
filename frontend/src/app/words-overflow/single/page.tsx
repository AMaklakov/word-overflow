'use client'

import { useRouter } from 'next/navigation'
import WORDS from './words.json'
import useLetterEvent from '@/useLetterEvent'
import _ from 'lodash'
import { useMemo, useState, useCallback, useDeferredValue } from 'react'
import { IStats, GameOver, Stats } from '../Stats'
import { IWord, Words } from '../Word'

const COLORS = ['#00AC11', '#E20101', '#E36D00', '#9000E9', '#F3DB00']
const N = 20

export default function SingleGame() {
  const nav = useRouter()
  const handleEnd = () => nav.replace('/')

  const color = useMemo(() => _.sample(COLORS)!, [])
  const [words, setWords] = useState<IWord[]>(() => createWords(WORDS, N))
  const isEnd = useMemo(() => _.every(words, (w) => w.text.length === w.written), [words])

  const handleType = useCallback((key: string, color: string) => setWords(updateWords(key, color)), [])
  const handleKey = useCallback((key: string) => handleType(key, color), [color, handleType])
  useLetterEvent(handleKey, !isEnd)

  // TODO: maybe debounce?
  const deferredWords = useDeferredValue(words)
  const stats = useMemo<IStats>(
    () => [{ color: color, words: _.filter(deferredWords, { color: color }) }],
    [color, deferredWords]
  )

  const handleRestart = useCallback(() => setWords(createWords(WORDS, N)), [])

  return (
    <>
      <Words words={words} />
      <Stats stats={stats} />
      {isEnd && <GameOver stats={stats} onEnd={handleEnd} onRestart={handleRestart} />}
    </>
  )
}

const createWords = (wordsS: string[], n = 50): IWord[] => {
  const words: IWord[] = []
  const set = new Set()
  while (words.length < n) {
    const word = _.sample(wordsS)!.toLowerCase()

    const hasWord = set.has(word) || set.has(_.capitalize(word))
    if (hasWord) {
      continue
    }

    const hasLower = set.has(word[0])
    if (!hasLower) {
      set.add(word[0])
      words.push({ text: word, written: 0 })
      continue
    }

    const hasUpper = set.has(word[0].toUpperCase())
    if (!hasUpper) {
      set.add(word[0].toUpperCase())
      words.push({ text: _.capitalize(word), written: 0 })
      continue
    }
  }
  return words
}

const updateWords = (letter: string, color: string) => (words: IWord[]) => {
  let index = _.findLastIndex(words, (w) => _.inRange(w.written, 0, w.text.length) && w.color === color)
  if (index >= 0) {
    const nextLetter = words[index].text.substring(words[index].written)[0]
    return nextLetter !== letter ? words : words.map((w, i) => (i === index ? { ...w, written: w.written + 1 } : w))
  }

  index = _.findLastIndex(words, (w) => w.written === 0 && !w.color && w.text.startsWith(letter))
  if (index < 0) return words
  return words.map((w, i) => (i === index ? { ...w, written: w.written + 1, color } : w))
}
