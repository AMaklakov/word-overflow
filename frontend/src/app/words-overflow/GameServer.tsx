'use client'

import _ from 'lodash'
import useLetterEvent from '@/useLetterEvent'
import { IStateData } from './Message'
import { GameOver, Stats } from './Stats'
import { Words } from './Word'

interface Props {
  sendKey: (key: string) => void
  data: IStateData
  onEnd: () => void
  onRestart: () => void
}

export default function Game(props: Props) {
  const { data, onEnd, sendKey, onRestart } = props
  const { words, stats, isEnd } = data

  useLetterEvent(sendKey, !isEnd)

  return (
    <>
      <Words words={words} />
      <Stats stats={stats} />
      {isEnd && <GameOver stats={stats} onEnd={onEnd} onRestart={onRestart} />}
    </>
  )
}
