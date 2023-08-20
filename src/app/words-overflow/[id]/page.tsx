'use client'

import _ from 'lodash'
import { useRTC } from '@/useRtc'
import GameServer from '../GameServer'

export default function OnlineSever({ params }: any) {
  const dc = useRTC(params.id, 'create')
  return dc ? (
    <GameServer dc={dc} />
  ) : (
    <div>
      <h2>Waiting for a friend to connect...</h2>
      <p>
        Send this code to your friend: <span className="text-5xl font-bold">{params.id}</span>
      </p>
    </div>
  )
}

