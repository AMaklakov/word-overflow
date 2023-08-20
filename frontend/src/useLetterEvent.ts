import { useEffect } from 'react'

export default function useLetterEvent(handler: (key: string) => void, shouldListen: boolean = true) {
  useEffect(() => {
    if (!shouldListen) return

    const handleKeypress = (e: KeyboardEvent) => handler(e.key)
    window.addEventListener('keypress', handleKeypress)
    return () => window.removeEventListener('keypress', handleKeypress)
  }, [handler, shouldListen])
}
