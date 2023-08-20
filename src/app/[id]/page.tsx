'use client'

import { useEffect, useMemo, useState } from 'react'

const config: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }],
}

async function post(body) {
  return fetch('/api/rtc', {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.json())
}

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

/////////////////////

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

const connectRTC = async (id: string) => {
  const pc = create(id, 'candidate2')

  let body = await getResp(id, 'offer')
  await pc.setRemoteDescription(new RTCSessionDescription(body?.offer))

  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  await post({ id, data: { answer } })

  body = await getResp(id, 'candidate1')
  await pc.addIceCandidate(new RTCIceCandidate(body['candidate1']))

  pc.ondatachannel = (event) => {
    window.dc = event.channel
    window.dc.onmessage = (event) => {
      console.log('get message from author', event)
      window.dispatchEvent(new CustomEvent('customMessage', { detail: event }))
    }
  }

  return pc
}

export default function Home({ params, searchParams }: any) {
  const [pc, setPC] = useState<RTCPeerConnection | null>(null)
  const [dc, setDC] = useState<RTCDataChannel | null>(null)

  useEffect(() => {
    if (searchParams.owner === 'true') {
      setRTC(params.id).then(setPC as any)
    } else {
      connectRTC(params.id).then(setPC as any)
    }
  }, [params.id, searchParams.owner])

  if (!pc) {
    return <div>Connecting...</div>
  }
  return searchParams.owner === 'true' ? <Creator /> : <Sub />
}

const MAX = 7

const lerp = (start, end, t) => start * (1 - t) + end * t

function Creator() {
  const [words, setWords] = useState<{ id: number; label: string }[]>([])
  const [started, setStarted] = useState(false)

  const onAddWord = (word) => {
    const w = {
      id: Date.now(),
      label: word,
    }

    setWords([...words, w])
    if (words.length === 2) {
      setStarted(true)
    }
  }

  useEffect(() => {
    if (started) {
      console.count('sending')
      window.dc?.send(JSON.stringify(words))
    }
  }, [started, words])

  // useEffect(() => {
  //   console.log('checking', window.dc)
  //   if (window.dc) {
  //     window.dc.onmessage = (event) => {

  //     }
  //   }
  // }, [])

  useEffect(() => {
    const f = (event) => {
      const word = event.detail.data
      setWords((w) => w.filter((x) => x.label.toLowerCase() !== word.toLowerCase()))
    }
    window.addEventListener('customMessage', f)
    return () => {
      window.removeEventListener('customMessage', f)
    }
  }, [])

  const state = useMemo(() => {
    if (started && MAX < words.length) {
      return 'You win!'
    }
    if (started && words.length === 0) {
      return 'You loose!'
    }
    return null
  }, [started, words.length])

  if (state) {
    return <div className="text-red-200 text-7xl w-screen h-screen flex justify-center items-center">{state}</div>
  }

  return (
    <Input onSubmit={onAddWord}>
      {words.map((w, index) => (
        <Word key={w.id} label={w.label} color={`rgba(0, 255, 0, ${1 / (7 - index)})`} />
      ))}
    </Input>
  )
}

function Sub() {
  const [words, setWords] = useState<{ id: number; label: string }[]>([])
  const [started, setStarted] = useState(false)

  const onRemoveWord = (word) => {
    window.dc?.send(word)
  }

  useEffect(() => {
    // console.log('checking', window.dc)
    // if (window.dc) {
    //   window.dc.onmessage = (event) => {
    //     const words = JSON.parse(event.data)
    //     setWords(words.reverse())
    //     setStarted(true)
    //   }
    // }
    const f = (event) => {
      console.log('event', event)
      const words = JSON.parse(event.detail.data)
      setWords(words.reverse())
      setStarted(true)
    }
    window.addEventListener('customMessage', f)
    return () => {
      window.removeEventListener('customMessage', f)
    }
  }, [])

  const state = useMemo(() => {
    if (started && MAX < words.length) {
      return 'You loose!'
    }
    if (started && words.length === 0) {
      return 'You win!'
    }
    return null
  }, [started, words.length])

  if (state) {
    return <div className="text-red-200 text-7xl w-screen h-screen flex justify-center items-center">{state}</div>
  }
  return (
    <Input onSubmit={onRemoveWord}>
      {words.map((w, index) => (
        <Word key={w.id} label={w.label} color={`rgba(255, 0, 0, ${1 / (7 - index)})`} />
      ))}
    </Input>
  )
}

function Word({ label, color }) {
  return (
    <div className="flex justify-center h-10" style={{ backgroundColor: color }}>
      {label}
    </div>
  )
}

function Input({ onSubmit, children }) {
  const [message, setMessage] = useState('')
  const onButton = () => {
    onSubmit?.(message.toLowerCase())
    setMessage('')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col grow">{children}</div>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full h-24 text-black text-5xl"
        />
        <button onClick={onButton} className="h-24 w-24 bg-gray-300 text-black">
          Send
        </button>
      </div>
    </div>
  )
}
