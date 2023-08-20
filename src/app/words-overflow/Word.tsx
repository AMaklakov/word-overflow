import React, { useEffect, useMemo, useRef, useState } from 'react'
import _ from 'lodash'

// const shakes = _.times(100, (i) => lerp(-Math.PI / 40, Math.PI / 40, i / 100))
// const getShake = (n: number) => shakes[((n * 1000) | 0) % shakes.length]

export interface IWord {
  text: string
  written: number
  color?: string
}

export const Words = ({ words }: { words: IWord[] }) => {
  return (
    <div className="flex flex-wrap gap-5 px-5">
      {words.map((w) => (
        <Word key={w.text} word={w} />
      ))}
    </div>
  )
}

const Word = ({ word }: { word: IWord }) => {
  const written = word.text.substring(0, word.written).split('')
  const remain = word.text.substring(word.written).split('')
  const isEnd = word.text.length === word.written

  // const [shake, setShake] = useState(false)
  // useEffect(() => {
  //   if (!written.length) return

  //   setShake(true)
  //   const id = setTimeout(() => setShake(false), 1000)
  //   return () => clearInterval(id)
  // }, [written.length])

  // useEffect(() => {
  //   if (isEnd) {
  //     const dir = _.times(2, () => _.random(-Math.PI, Math.PI, true))
  //     api.applyImpulse([...dir, 10], position)
  //   }
  // }, [api, isEnd, ...position])

  return (
    <div
      style={{ backgroundColor: word.color ? word.color + '60' : 'white', opacity: isEnd ? 0 : 1 }}
      className={`font-semibold text-[#B1B1B1] text-lg sm:text-xl lg:text-2xl xl:text-3x font-mono rounded-3xl p-3`}
    >
      {written.map((x, i) => (
        <span key={x + i} style={{ color: word.color }}>
          {x}
        </span>
      ))}
      {remain.map((x, i) => (
        <span key={x + i}>{x}</span>
      ))}
    </div>
  )
}
