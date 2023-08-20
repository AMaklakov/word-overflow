'use client'

import { useRouter } from 'next/navigation'
import GameServer from '../GameServer'

export default function SingleGame() {
  const nav = useRouter()
  return <GameServer onEnd={() => nav.replace('/')} />
}
