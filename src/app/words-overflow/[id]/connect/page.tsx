'use client'

import { useCallback, useState } from 'react'
import { IWord, Words } from '@/app/words-overflow/Word'
import { useRTC } from '@/useRtc'
import _ from 'lodash'
import { useDataChannel } from '@/useDataChannel'
import { GameOver, Stats, IStats } from '@/app/words-overflow/Stats'
import { IMessage, IResponseMessage } from '@/app/words-overflow/Message'
import useLetterEvent from '@/useLetterEvent'
import { useRouter } from 'next/navigation'

export default function ConnectGame({ params }: any) {
  const nav = useRouter()
  const dc = useRTC(params.id, 'connect')
  return dc ? <Sub dc={dc} onEnd={() => nav.replace('/')} /> : <div>Connecting to the game...</div>
}

function Sub({ dc, onEnd }: { dc: RTCDataChannel; onEnd: () => void }) {
  const [words, setWords] = useState<IWord[]>([])
  const [stats, setStats] = useState<IStats>([])
  const [isEnd, setIsEnd] = useState(false)

  const handleMessage = useCallback((message: IMessage) => {
    setWords(message.words)
    setStats(message.stats)
    setIsEnd(message.isEnd)
  }, [])

  const [sendMessage] = useDataChannel<IResponseMessage, IMessage>(dc, handleMessage)

  const handleKey = useCallback((key: string) => sendMessage({ key }), [sendMessage])
  useLetterEvent(handleKey, !stats)

  return (
    <>
      <Words words={words} />
      <Stats stats={stats} />
      {isEnd && <GameOver stats={stats} onEnd={onEnd} />}
    </>
  )
}
