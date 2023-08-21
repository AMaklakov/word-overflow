'use client'

import _ from 'lodash'
import useLetterEvent from '@/useLetterEvent'
import { IStateData } from './Message'
import { GameOver, Stats } from './Stats'
import { Words } from './Word'

interface Props {
  sendKey: (key: string) => void
  data: IStateData
  statistics: Record<string, string | number>
  onEnd: () => void
  onRestart: () => void
}

export default function Game(props: Props) {
  const { data, onEnd, sendKey, onRestart, statistics } = props
  const { words, stats, status } = data

  useLetterEvent(sendKey, status === 'running')

  return (
    <>
      <Words words={words} />
      <Stats stats={stats} statistics={statistics} />
      {status === 'finished' && <GameOver stats={stats} onEnd={onEnd} onRestart={onRestart} />}
    </>
  )
}
