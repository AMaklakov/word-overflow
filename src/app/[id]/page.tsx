'use client'

import { useEffect, useState } from 'react'

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
  pc.onconnectionstatechange = console.log.bind(null, 'onconnectionstatechange')
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
  dc.onmessage = console.log.bind(null, 'message from sub')
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
  // console.log('aaa', pc, pc?.connectionState)

  // useEffect(() => {
  //   const dc =
  //   if (dc) {
  //     setDC(dc)¨
  //   }
  // }, [pc])

  const [message, setMessage] = useState('')
  const sendMessage = () => {
    window.dc?.send(message)
  }
  return (
    <div>
      {pc && <input value={message} onChange={(e) => setMessage(e.target.value)} />}
      <button onClick={sendMessage}>send</button>
    </div>
  )
}
