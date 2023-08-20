import { useEffect } from 'react'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz,./;\'[]":<>?-_'
const KEYS = new Set([...ALPHABET.split(''), ...ALPHABET.toUpperCase().split('')])

export default function useLetterEvent(handler: (key: string) => void, shouldListen: boolean = true) {
  useEffect(() => {
    if (!shouldListen) return

    const handleKeyup = (e: KeyboardEvent) => KEYS.has(e.key) && handler(e.key)
    window.addEventListener('keyup', handleKeyup)
    return () => {
      window.removeEventListener('keyup', handleKeyup)
    }
  }, [handler, shouldListen])
}
