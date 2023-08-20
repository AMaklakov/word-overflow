'use client'

import { useCallback, useEffect, useState } from 'react'
import { IWord, Words } from '@/app/Word'
import { useRTC } from '@/useRtc'
import _ from 'lodash'
import { useDataChannel } from '@/useDataChannel'
import Stats from '@/app/Stats'

export default function ConnectGame({ params }: any) {
  const [dc, pc] = useRTC(params.id, 'connect')
  return pc && dc ? <Sub dc={dc} /> : <div>Connecting to the game...</div>
}

function Sub({ dc }: { dc: RTCDataChannel }) {
  const [words, setWords] = useState<IWord[]>([])
  const [stats, setStats] = useState<any>(null)

  const handleMessage = useCallback((event: MessageEvent<any>) => {
    const data = JSON.parse(event.data)
    data.length === 2 ? setStats(data) : setWords(data)
  }, [])

  const [sendMessage] = useDataChannel(dc, handleMessage)

  useEffect(() => {
    if (stats) return

    const f = (e) => sendMessage(e.key)
    window.addEventListener('keyup', f)
    return () => {
      window.removeEventListener('keyup', f)
    }
  }, [sendMessage, stats])

  return (
    <>
      <Words words={words} />
      <Stats stats={stats} />
    </>
  )
}
