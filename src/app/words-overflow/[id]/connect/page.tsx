'use client'

import { useCallback, useState } from 'react'
import { IWord, Words } from '@/app/words-overflow/Word 1'
import { useRTC } from '@/useRtc'
import _ from 'lodash'
import { useDataChannel } from '@/useDataChannel'
import GameOver, { IStats } from '@/app/words-overflow/Stats'
import { IMessage, IResponseMessage } from '@/app/words-overflow/Message'
import useLetterEvent from '@/useLetterEvent'

export default function ConnectGame({ params }: any) {
  const dc = useRTC(params.id, 'connect')
  return dc ? <Sub dc={dc} /> : <div>Connecting to the game...</div>
}

function Sub({ dc }: { dc: RTCDataChannel }) {
  const [words, setWords] = useState<IWord[]>([])
  const [stats, setStats] = useState<IStats | null>(null)

  const handleMessage = useCallback((message: IMessage) => {
    setWords(message.words)
    setStats(message.stats)
  }, [])

  const [sendMessage] = useDataChannel<IResponseMessage, IMessage>(dc, handleMessage)

  const handleKey = useCallback((key: string) => sendMessage({ key }), [sendMessage])
  useLetterEvent(handleKey, !stats)

  return (
    <>
      <Words words={words} />
      <GameOver stats={stats} />
    </>
  )
}
