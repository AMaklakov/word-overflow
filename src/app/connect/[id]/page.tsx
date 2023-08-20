'use client'

import Word, { IWord } from '@/app/Word'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'

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

export default function ConnectGame({ params, searchParams }: any) {
  const [pc, setPC] = useState<RTCPeerConnection | null>(null)

  useEffect(() => {
    connectRTC(params.id).then(setPC as any)
  }, [params.id, searchParams.owner])

  if (!pc) {
    return <div>Connecting...</div>
  }
  return <Sub />
}

function Sub() {
  const [words, setWords] = useState<IWord[]>([])

  useEffect(() => {
    const f = (event) => {
      console.log('event1111', event)
      setWords(JSON.parse(event.detail.data))
    }
    window.addEventListener('customMessage', f)
    return () => {
      window.removeEventListener('customMessage', f)
    }
  }, [])

  useEffect(() => {
    const f = (e) => window.dc?.send(e.key)
    window.addEventListener('keyup', f)
    return () => {
      window.removeEventListener('keyup', f)
    }
  }, [])

  console.log(words)

  return (
    <div className="flex flex-col min-h-screen">
      {words.map((w) => (
        <Word key={w.text} word={w} />
      ))}
    </div>
  )
}
