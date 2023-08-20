'use client'

import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react'
import WORDS from './words.json'
import _ from 'lodash'
import Word, { IWord } from '../Word'

const config: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }],
}

const post = async (body) => fetch('/api/rtc', { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json())

function onAddStream(event) {
  console.log('stream', event)
  //remoteVideo.srcObject = event.streams[0];
  // remoteStream = event.streams[0];
}

const onicecandidate = (id, field) =>
  function (event) {
    console.log(`sending ice candidate`, event.candidate)
    if (event.candidate) {
      console.log()
      post({ id, data: { [field]: event.candidate } })
    }
  }

const wait = (n = 1000) => new Promise((res) => setTimeout(res, n))

const create = (id, field) => {
  const pc = (window.pc = new RTCPeerConnection(config))
  // pc.onconnectionstatechange = console.log.bind(null, 'onconnectionstatechange')
  pc.onicecandidate = onicecandidate(id, field)
  pc.ontrack = onAddStream
  return pc
}

const getResp = async (id: string, field) => {
  while (true) {
    const data = await post({ id })
    if (data?.[field]) {
      return data
    }
    console.count(`waiting ${field}`)
    await wait()
  }
}

const setRTC = async (id: string) => {
  const pc = create(id, 'candidate1')
  const dc = pc.createDataChannel(id, { ordered: true })
  dc.onmessage = (event) => {
    console.log('message from sub', event)
    window.dispatchEvent(new CustomEvent('customMessage', { detail: event }))
  }

  window.dc = dc

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await post({ id, data: { offer } })

  let body = await getResp(id, 'answer')
  await pc.setRemoteDescription(new RTCSessionDescription(body?.answer))

  body = await getResp(id, 'candidate2')
  await pc.addIceCandidate(new RTCIceCandidate(body['candidate2']))

  pc.ondatachannel = console.log.bind(null, 'ondatachannel')

  return pc
}

export default function CreateGame({ params }: any) {
  const [pc, setPC] = useState<RTCPeerConnection | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setRTC(params.id).then(setPC as any)
  }, [params.id])

  if (!pc) {
    return <div>Waiting to connect...</div>
  }
  return <Creator />
}

let sendQueue = [] as string[]
function sendMessage(msg) {
  const dataChannel = window.dc
  switch (dataChannel.readyState) {
    case 'connecting':
      console.log(`Connection not open; queueing: ${msg}`)
      sendQueue.push(msg)
      break
    case 'open':
      sendQueue.push(msg)
      sendQueue.forEach((msg) => dataChannel.send(msg))
      sendQueue = []

      break
    case 'closing':
      console.log(`Attempted to send message while closing: ${msg}`)
      break
    case 'closed':
      console.log('Error! Attempt to send while connection closed.')
      break
  }
}

function Creator() {
  const [words, setWords] = useState<IWord[]>(() => _.sampleSize(WORDS, 10).map((x) => ({ text: x, written: 0 })))

  useEffect(() => {
    setInterval(() => {
      setWords((w) => [...w, { text: _.sample(WORDS)!, written: 0 }])
    }, 3000)
  }, [])

  const handleType = useCallback((letter: string, color: string = 'green') => {
    setWords((words) => {
      let index = _.findIndex(words, (w) => w.written !== 0 && w.color === color)
      const nextLetter = words[index]?.text.substring(words[index].written)[0]
      if (index >= 0) {
        if (nextLetter?.toLowerCase() !== letter.toLowerCase()) {
          return words
        }
        if (words[index].written + 1 === words[index].text.length) {
          return words.filter((_, i) => i !== index)
        }
        return words.map((w, i) => (i === index ? { ...w, written: w.written + 1 } : w))
      }

      index = _.findIndex(words, (w) => w.written === 0 && !w.color && w.text.startsWith(letter))
      if (index < 0) return words
      return words.map((w, i) => (i === index ? { ...w, written: w.written + 1, color } : w))
    })
  }, [])

  useEffect(() => {
    const f = (e) => handleType(e.key)
    window.addEventListener('keyup', f)
    return () => {
      window.removeEventListener('keyup', f)
    }
  }, [handleType])

  useEffect(() => {
    const f = (event) => {
      console.log('received', event.detail)
      handleType(event.detail.data, 'blue')
    }
    window.addEventListener('customMessage', f)
    return () => {
      window.removeEventListener('customMessage', f)
    }
  }, [handleType])

  useEffect(() => {
    sendMessage(JSON.stringify(words))
  }, [words])

  return (
    <div className="flex flex-col min-h-screen">
      {words.map((w) => (
        <Word key={w.text} word={w} />
      ))}
    </div>
  )
}

// function Input({ onSubmit, children }) {
//   const [message, setMessage] = useState('')
//   const onButton = () => {
//     onSubmit?.(message.toLowerCase())
//     setMessage('')
//   }

//   return (
//     <div className="flex flex-col min-h-screen">
//       <div className="flex flex-col grow">{children}</div>
//       <div className="flex gap-2">
//         <input
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           className="w-full h-24 text-black text-5xl"
//         />
//         <button onClick={onButton} className="h-24 w-24 bg-gray-300 text-black">
//           Send
//         </button>
//       </div>
//     </div>
//   )
// }
