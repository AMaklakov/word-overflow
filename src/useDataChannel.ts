import { useCallback, useEffect, useRef } from 'react'

export const useDataChannel = <S, R>(dc: RTCDataChannel, onMessage: (data: R) => void) => {
  let sendQueue = useRef<string[]>([])

  const sendMessage = useCallback(
    (msg?: S) => {
      if (msg != null) {
        sendQueue.current.push(JSON.stringify(msg))
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
    const handleMessage = (message: MessageEvent<string>) => onMessage?.(JSON.parse(message.data))
    const handleOpen = () => sendMessage()
    dc.addEventListener('message', handleMessage)
    dc.addEventListener('open', handleOpen)
    return () => {
      dc.removeEventListener('message', handleMessage)
      dc.addEventListener('open', handleOpen)
    }
  }, [dc, onMessage, sendMessage])

  return [sendMessage]
}
