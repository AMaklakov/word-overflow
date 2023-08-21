'use client'

import _ from 'lodash'
import Game from '../GameServer'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useObservableState } from 'observable-hooks'
import { ICpmMessage, IDataMessage, IMessage, ITyposMessage } from '../Message'
import { webSocket } from 'rxjs/webSocket'
import CONFIG from '@/config'
import { filter, map } from 'rxjs/operators'
import Link from 'next/link'

const API = CONFIG.API_URL

export default function OnlineSever({ params }: any) {
  const nav = useRouter()

  const socket$ = useMemo(() => webSocket<IMessage>(`ws://${API}/words-overflow/${params.id}/ws`), [params.id])
  const [data] = useObservableState(() =>
    socket$.pipe(
      filter((message) => message.type === 'data'),
      map((message) => (message as IDataMessage).data!)
    )
  )
  const [cpm = 0] = useObservableState(() =>
    socket$.pipe(
      filter((message) => message.type === 'cpm'),
      map((message) => (message as ICpmMessage).data || 0)
    )
  )
  const [typos = 0] = useObservableState(() =>
    socket$.pipe(
      filter((message) => message.type === 'typos'),
      map((message) => (message as ITyposMessage).data || 0)
    )
  )

  const handleSendKey = (key: string) => socket$.next({ type: 'key', data: key })

  if (data?.status === 'idle') {
    return (
      <div>
        <h2>Waiting for a friend to connect...</h2>
        <p>
          Send this code to your friend: <span className="text-5xl font-bold">{params.id}</span>
        </p>
      </div>
    )
  }
  if (data?.timeout) {
    return <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">{data.timeout}</div>
  }
  if (data) {
    return (
      <Game
        data={data}
        statistics={{ cpm, typos }}
        sendKey={handleSendKey}
        onEnd={() => nav.replace('/')}
        onRestart={() => socket$.next({ type: 'restart' })}
      />
    )
  }
  return (
    <p>
      The game was not created. Please return back to the <Link href="/">Home page</Link> and create a new game
    </p>
  )
}
