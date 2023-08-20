'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [id, setId] = useState('')

  return (
    <div>
      <input value={id} onChange={(e) => setId(e.target.value)} />
      <Link href={`/${id}?owner=true`} prefetch={false}>
        Create Game
      </Link>
    </div>
  )
}
