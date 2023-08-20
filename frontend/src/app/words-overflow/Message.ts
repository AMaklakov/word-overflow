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

export interface IRestartMessage {
  type: 'restart'
}

export type IMessage = IDataMessage | IRestartMessage | IKeyMessage

export interface IStateData {
  id: string
  words: IWord[]
  stats: IStats
  isEnd: boolean
  timeout: number
  config: {
    timeout: number
  }
}

export type IKeyData = string

export interface ICreateGameConfig {
  words: number
  players: number
  timeout: number
}

export interface IErrorMessage {
  message: string
}
