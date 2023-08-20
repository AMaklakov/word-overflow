import { useCallback, useEffect, useRef } from 'react'

export const useDataChannel = (dc: RTCDataChannel, onMessage: (event: MessageEvent<any>) => void) => {
  let sendQueue = useRef<string[]>([])

  const sendMessage = useCallback(
    (msg?: string) => {
      if (msg != null) {
        sendQueue.current.push(msg)
      }

      if (dc.readyState !== 'open') {
        // console.log(`Connection not open; Status: ${dc.readyState} queueing message`)
        return
      }

      sendQueue.current.forEach((msg) => dc.send(msg))
      sendQueue.current = []
    },
    [dc]
  )

  useEffect(() => {
    const onOpen = () => sendMessage()
    dc.addEventListener('message', onMessage)
    dc.addEventListener('open', onOpen)
    return () => {
      dc.removeEventListener('message', onMessage)
      dc.addEventListener('open', onOpen)
    }
  }, [dc, onMessage, sendMessage])

  return [sendMessage]
}
