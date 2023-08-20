'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [id, setId] = useState('')

  return (
    <div>
      <input value={id} onChange={(e) => setId(e.target.value)} />
      <Link href={`/${id}`} prefetch={false}>
        Create Game
      </Link>
      <Link href={`/connect/${id}`} prefetch={false}>
        Join Game
      </Link>
    </div>
  )
}
