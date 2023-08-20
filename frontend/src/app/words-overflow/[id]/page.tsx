'use client'

import _ from 'lodash'
import Game from '../GameServer'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useObservableState } from 'observable-hooks'
import { IDataMessage, IMessage, IStateData } from '../Message'
import { webSocket } from 'rxjs/webSocket'
import CONFIG from '@/config'
import { filter, map } from 'rxjs/operators'

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
  const [timeout, initialTimeout] = useMemo(() => [data?.timeout || 0, data?.config.timeout || 0], [data])

  const handleSendKey = (key: string) => socket$.next({ type: 'key', data: key })

  if (timeout && timeout == initialTimeout) {
    return (
      <div>
        <h2>Waiting for a friend to connect...</h2>
        <p>
          Send this code to your friend: <span className="text-5xl font-bold">{params.id}</span>
        </p>
      </div>
    )
  }
  if (timeout) {
    return <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">{timeout}</div>
  }
  if (data) {
    return (
      <Game
        data={data}
        sendKey={handleSendKey}
        onEnd={() => nav.replace('/')}
        onRestart={() => socket$.next({ type: 'restart' })}
      />
    )
  }
}
