import { IWord } from '@/app/words-overflow/Word'
import { IStats } from '@/app/words-overflow/Stats'

export interface IMessage {
  words: IWord[]
  stats: IStats
  isEnd: boolean
}

export interface IResponseMessage {
  key: string
}
