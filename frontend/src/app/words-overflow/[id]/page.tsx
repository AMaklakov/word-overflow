'use client'

import _ from 'lodash'
import Game from '../GameServer'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useObservableState } from 'observable-hooks'
import { IDataMessage, IMessage, IStateData, ITimerMessage } from '../Message'
import { webSocket } from 'rxjs/webSocket'
import CONFIG from '@/config'
import { filter, map } from 'rxjs/operators'

const API = CONFIG.API_URL

export default function OnlineSever({ params }: any) {
  const nav = useRouter()

  const socket$ = useMemo(() => webSocket<IMessage>(`ws://${API}/ws?gameId=${params.id}`), [params.id])
  const [data] = useObservableState(() =>
    socket$.pipe(
      filter((message) => message.type === 'data'),
      map((message) => (message as IDataMessage).data!)
    )
  )
  const timer = useMemo(() => data?.counter || 0, [data])

  const handleSendKey = (key: string) => socket$.next({ type: 'key', data: key })

  if (timer) {
    return <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">{timer}</div>
  }
  if (data) {
    return (
      <Game
        data={data as any as IStateData}
        onEnd={() => nav.replace('/')}
        sendKey={handleSendKey}
        onRestart={() => void 0}
      />
    )
  }
  return (
    <div>
      <h2>Waiting for a friend to connect...</h2>
      <p>
        Send this code to your friend: <span className="text-5xl font-bold">{params.id}</span>
      </p>
    </div>
  )
}
