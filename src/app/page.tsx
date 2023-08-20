'use client'

import { getCreatedGames, publishGame } from '@/web-socket'
import _ from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [id, setId] = useState('')

  const createGame = async () => {
    const games = await getCreatedGames()
    let gameId = getId()
    while (games.includes(gameId)) {
      gameId = getId()
    }
    await publishGame(gameId)
    router.push(`/words-overflow/${gameId}`)
  }

  const joinGame = async () => {
    const games = await getCreatedGames()
    if (games.includes(id)) {
      router.push(`/words-overflow/${id}/connect`)
    } else {
      alert('No such game found')
    }
  }

  return (
    <div className="flex flex-col justify-center">
      <div className="flex justify-between">
        <div>
          <h2>Single player</h2>
          <Link href="/words-overflow/single">Play alone</Link>
        </div>
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

// TODO make it uniq for each 5 minutes so that nobody can misspell the game id
function getId(length: number = 4): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return _.times(length, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('')
}
