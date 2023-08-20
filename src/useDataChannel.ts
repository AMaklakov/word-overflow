import { useCallback, useEffect, useRef } from 'react'

export const useDataChannel = (dc: RTCDataChannel, onMessage?: (event: MessageEvent<any>) => void) => {
  let sendQueue = useRef<string[]>([])

  useEffect(() => {
    console.log('here')
    let isActive = true
    dc.onmessage = (event) => isActive && onMessage?.(event)
    return () => {
      isActive = false
    }
  }, [dc, onMessage])

  const sendMessage = useCallback(
    (msg: string) => {
      sendQueue.current.push(msg)

      if (dc.readyState !== 'open') {
        console.log(`Connection not open; Status: ${dc.readyState} queueing message`)
        return
      }

      sendQueue.current.forEach((msg) => dc.send(msg))
      sendQueue.current = []
    },
    [dc]
  )

  return [sendMessage]
}
