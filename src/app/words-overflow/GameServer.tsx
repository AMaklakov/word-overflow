'use client'

import { useMemo, useState, useCallback, useDeferredValue, useEffect, useLayoutEffect } from 'react'
import _ from 'lodash'
import { useDataChannel } from '@/useDataChannel'
import useLetterEvent from '@/useLetterEvent'
import { IResponseMessage, IMessage } from './Message'
import Stats, { IStats } from './Stats'
import { IWord, Words } from './Word'
import WORDS from './words.json'

const COLORS = ['#00AC11', '#E20101', '#E36D00', '#9000E9', '#F3DB00']

export default function GameServer({ dc }: { dc?: RTCDataChannel }) {
  const [currentColor, partnerColor] = useMemo(() => _.sampleSize(COLORS, 2), [])
  const [words, setWords] = useState<IWord[]>(() => createWords(WORDS, 10))
  const [stats, setStats] = useState<IStats | null>(null)

  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const f = () => {
      setWidth(window.innerWidth)
      setHeight(window.innerHeight - document.querySelector('header')!.clientHeight - 10)
    }
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const handleType = useCallback((key: string, color: string) => setWords(updateWords(key, color)), [])
  const handleKey = useCallback((key: string) => handleType(key, currentColor), [currentColor, handleType])
  useLetterEvent(handleKey, !stats)

  const deferredWords = useDeferredValue(words)
  useEffect(() => {
    if (deferredWords.every((w) => w.text.length === w.written)) {
      const stats = [
        { color: currentColor, words: _.filter(deferredWords, { color: currentColor }) },
        { color: partnerColor, words: _.filter(deferredWords, { color: partnerColor }) },
      ]
      setStats(stats)
    }
  }, [currentColor, deferredWords, partnerColor])

  const handleMessage = useCallback(
    (m: IResponseMessage) => handleType(m.key, partnerColor),
    [handleType, partnerColor]
  )
  const [sendMessage] = useDataChannel<IMessage, IResponseMessage>(dc, handleMessage)
  useEffect(() => {
    sendMessage({ words, stats })
  }, [sendMessage, stats, words])

  return (
    <div
      style={{
        width,
        height,
      }}
    >
      <Words words={words} />
      <Stats stats={stats} />
    </div>
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
