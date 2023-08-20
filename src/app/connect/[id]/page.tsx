'use client'

import { useCallback, useEffect, useState } from 'react'
import { IWord, Words } from '@/app/Word'
import { useRTC } from '@/useRtc'
import _ from 'lodash'
import { useDataChannel } from '@/useDataChannel'

export default function ConnectGame({ params }: any) {
  const [dc, pc] = useRTC(params.id, 'connect')
  return pc && dc ? <Sub dc={dc} /> : <div>Connecting to the game...</div>
}

function Sub({ dc }: { dc: RTCDataChannel }) {
  const [words, setWords] = useState<IWord[]>([])

  const handleMessage = useCallback((event: MessageEvent<any>) => setWords(JSON.parse(event.data)), [])
  const [sendMessage] = useDataChannel(dc, handleMessage)
  useEffect(() => {
    const f = (e) => sendMessage(e.key)
    window.addEventListener('keyup', f)
    return () => {
      window.removeEventListener('keyup', f)
    }
  }, [sendMessage])

  return <Words words={words} />
}
