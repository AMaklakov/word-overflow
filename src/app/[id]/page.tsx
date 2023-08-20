'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import WORDS from './words.json'
import _ from 'lodash'
import { useRTC } from '@/useRtc'
import { IWord, Words } from '@/app/Word'
import { useDataChannel } from '@/useDataChannel'

const COLORS = ['#00AC11', '#E20101', '#E36D00', '#9000E9', '#F3DB00']

export default function CreateGame({ params }: any) {
  const [dc, pc] = useRTC(params.id, 'create')
  return pc && dc ? <Creator dc={dc} /> : <div>Waiting to connect...</div>
}

function Creator({ dc }: { dc: RTCDataChannel }) {
  const [currentColor, partnerColor] = useMemo(() => _.sampleSize(COLORS, 2), [])
  const [words, setWords] = useState<IWord[]>(() => _.sampleSize(WORDS, 50).map((x) => ({ text: x, written: 0 })))

  const handleType = useCallback((letter: string, color: string) => {
    setWords((words) => {
      let index = _.findLastIndex(words, (w) => w.written !== 0 && w.color === color)
      const nextLetter = words[index]?.text.substring(words[index].written)[0]
      if (index >= 0) {
        if (nextLetter?.toLowerCase() !== letter.toLowerCase()) {
          return words
        }
        if (words[index].written + 1 === words[index].text.length) {
          return words.filter((_, i) => i !== index)
        }
        return words.map((w, i) => (i === index ? { ...w, written: w.written + 1 } : w))
      }

      index = _.findLastIndex(words, (w) => w.written === 0 && !w.color && w.text.startsWith(letter))
      if (index < 0) return words
      return words.map((w, i) => (i === index ? { ...w, written: w.written + 1, color } : w))
    })
  }, [])

  useEffect(() => {
    const f = (e) => handleType(e.key, currentColor)
    window.addEventListener('keyup', f)
    return () => {
      window.removeEventListener('keyup', f)
    }
  }, [currentColor, handleType])

  const handleMessage = useCallback(
    (event: MessageEvent<any>) => handleType(event.data, partnerColor),
    [handleType, partnerColor]
  )
  const [sendMessage] = useDataChannel(dc, handleMessage)
  useEffect(() => {
    sendMessage(JSON.stringify(words))
  }, [sendMessage, words])

  return (
    <div className="w-screen px-28">
      <Words words={words} />
    </div>
  )
}

// function Input({ onSubmit, children }) {
//   const [message, setMessage] = useState('')
//   const onButton = () => {
//     onSubmit?.(message.toLowerCase())
//     setMessage('')
//   }

//   return (
//     <div className="flex flex-col min-h-screen">
//       <div className="flex flex-col grow">{children}</div>
//       <div className="flex gap-2">
//         <input
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           className="w-full h-24 text-black text-5xl"
//         />
//         <button onClick={onButton} className="h-24 w-24 bg-gray-300 text-black">
//           Send
//         </button>
//       </div>
//     </div>
//   )
// }
