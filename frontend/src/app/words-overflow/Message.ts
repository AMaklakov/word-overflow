import { IWord } from '@/app/words-overflow/Word'
import { IStats } from '@/app/words-overflow/Stats'

export interface IDataMessage {
  type: 'data'
  data: IStateData
}

export interface IKeyMessage {
  type: 'key'
  data: IKeyData
}

export interface ITimerMessage {
  type: 'timer'
  data: number
}

export type IMessage = IDataMessage | ITimerMessage | IKeyMessage

export interface IStateData {
  words: IWord[]
  stats: IStats
  isEnd: boolean
  counter: number
}

export type IKeyData = string
