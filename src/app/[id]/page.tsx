'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import WORDS from './words.json'
import _ from 'lodash'
import { useRTC } from '@/useRtc'
import { IWord, Words } from '@/app/Word'
import { useDataChannel } from '@/useDataChannel'
import Stats from '@/app/Stats'

const COLORS = ['#00AC11', '#E20101', '#E36D00', '#9000E9', '#F3DB00']

export default function CreateGame({ params }: any) {
  const [dc, pc] = useRTC(params.id, 'create')
  return dc && pc ? <Creator dc={dc} /> : <div>Waiting to connect...</div>
}

function Creator({ dc }: { dc: RTCDataChannel }) {
  const [currentColor, partnerColor] = useMemo(() => _.sampleSize(COLORS, 2), [])
  const [words, setWords] = useState<IWord[]>(() => createWords(WORDS))
  const [stats, setStats] = useState<any>(null)

  const handleType = useCallback((letter: string, color: string) => setWords(updateWords(letter, color)), [])

  useEffect(() => {
    const f = (e) => handleType(e.key, currentColor)
    window.addEventListener('keyup', f)
    return () => {
      window.removeEventListener('keyup', f)
    }
  }, [currentColor, handleType, stats])

  const handleMessage = useCallback(
    (event: MessageEvent<any>) => handleType(event.data, partnerColor),
    [handleType, partnerColor]
  )
  const [sendMessage] = useDataChannel(dc, handleMessage)
  useEffect(() => {
    sendMessage(JSON.stringify(words))
  }, [sendMessage, words])

  const deferredWords = useDeferredValue(words)
  useEffect(() => {
    if (deferredWords.every((w) => w.text.length === w.written)) {
      const stats = [
        {
          color: currentColor,
          words: deferredWords.filter((w) => w.color === currentColor),
        },
        {
          color: currentColor,
          words: deferredWords.filter((w) => w.color === partnerColor),
        },
      ]
      setStats(stats)
      sendMessage(JSON.stringify(stats))
    }
  }, [currentColor, deferredWords, partnerColor, sendMessage])

  return (
    <>
      <Words words={words} />
      <Stats stats={stats} />
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
