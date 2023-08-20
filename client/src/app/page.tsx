'use client'

import CONFIG from '@/config'
import _ from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ICreateGameConfig, IErrorMessage, IStateData as IGameData } from '@/app/words-overflow/Message'

const URL = CONFIG.API_URL
const ID_LENGTH = 4

const WORDS_SELECT = {
  less: 10,
  standard: 20,
  more: 30,
} as const

const PLAYERS = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
} as const

const TIMEOUT = {
  less: 5,
  standard: 10,
  more: 20,
} as const

export default function Home() {
  const router = useRouter()
  const [id, setId] = useState('')

  const [words, setWords] = useState<keyof typeof WORDS_SELECT>('standard')
  const [players, setPlayers] = useState<keyof typeof PLAYERS>('2')
  const [timeouts, setTimeouts] = useState<keyof typeof TIMEOUT>('standard')

  const create = async () => {
    const game = await createGame({
      words: WORDS_SELECT[words] ?? WORDS_SELECT.standard,
      players: PLAYERS[players] ?? PLAYERS['2'],
      timeout: TIMEOUT[timeouts] ?? TIMEOUT.standard,
    })
    router.push(`/words-overflow/${game.id}`)
  }

  const join = async () => {
    if (id.length != ID_LENGTH) {
      alert('Id length is not valid')
      return
    }

    try {
      await checkGame(id)
      router.push(`/words-overflow/${id}`)
    } catch (e: any) {
      alert(e.message || e)
    }
  }

  return (
    <div className="flex flex-col justify-center">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <h2>Create a game</h2>

          <label>
            Words:
            <select value={words} onChange={(e) => setWords(e.target.value as any)}>
              {_.keys(WORDS_SELECT).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          <label>
            Players:
            <select value={players} onChange={(e) => setPlayers(e.target.value as any)}>
              {_.keys(PLAYERS).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          <label>
            Timeout:
            <select value={timeouts} onChange={(e) => setTimeouts(e.target.value as any)}>
              {_.keys(TIMEOUT).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          <button onClick={create}>Create</button>
        </div>
        <div>
          <h2>Connect to a game</h2>
          <input value={id} onChange={(e) => setId(e.target.value)} />
          <button onClick={join} disabled={id.length !== 4}>
            Join a game
          </button>
        </div>
      </div>
      {/* <hr />
      <div className="flex justify-between">
        <div>
          <h2>Create a game</h2>
          <button onClick={createGame}>Create</button>
        </div>
        <div>
          <h2>Connect to a game</h2>
          <input value={id} onChange={(e) => setId(e.target.value)} />
          <button onClick={joinGame} disabled={id.length !== 4}>
            Join a game
          </button>
        </div>
      </div> */}
    </div>
  )
}

const createGame = async (config: ICreateGameConfig) => {
  const res = await fetch(`http://${URL}/words-overflow`, { method: 'POST', body: JSON.stringify(config) })
  if (res.status > 299) {
    throw new Error((await res.json())?.message)
  }
  return (await res.json()) as IGameData
}

const checkGame = async (id: IGameData['id']) => {
  const res = await fetch(`http://${URL}/words-overflow/${id}`)
  if (res.status > 299) {
    throw new Error((await res.json())?.message)
  }
}
