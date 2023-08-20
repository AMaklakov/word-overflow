import { useEffect, useState } from 'react'

const CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }],
}

export const useRTC = (channelId: string, type: 'create' | 'connect') => {
  const [pc, setPC] = useState<RTCPeerConnection | null>(null)
  const [dc, setDC] = useState<RTCDataChannel | null>(null)

  useEffect(() => {
    let isActive = true

    if (channelId) {
      ;(type === 'create' ? createRTCConnection(channelId) : connectToRTC(channelId)).then(([dc, pc]) => {
        if (isActive) {
          setPC(pc)
          setDC(dc)
        }
      })
    }

    return () => {
      isActive = false
    }
  }, [channelId, type])

  return [dc, pc] as const
}

const createRTCConnection = async (id: string) => {
  const pc = create(id, 'candidate1')
  const dc = pc.createDataChannel(id, { ordered: true })

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await post({ id, data: { offer } })

  let body = await poll(id, 'answer')
  await pc.setRemoteDescription(new RTCSessionDescription(body?.answer))

  body = await poll(id, 'candidate2')
  await pc.addIceCandidate(new RTCIceCandidate(body['candidate2']))

  return [dc, pc] as const
}

const connectToRTC = async (id: string) => {
  let res: (v: RTCDataChannel) => void
  let dc = new Promise<RTCDataChannel>((r) => (res = r))

  const pc = create(id, 'candidate2')
  pc.ondatachannel = (event) => {
    event.channel.onclosing = console.warn
    event.channel.onerror = console.error
    return res(event.channel)
  }

  let body = await poll(id, 'offer')
  await pc.setRemoteDescription(new RTCSessionDescription(body?.offer))

  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  await post({ id, data: { answer } })

  body = await poll(id, 'candidate1')
  await pc.addIceCandidate(new RTCIceCandidate(body['candidate1']))

  return [await dc, pc] as const
}

const create = (id, field) => {
  const pc = new RTCPeerConnection(CONFIG)
  // pc.onconnectionstatechange = console.log.bind(null, 'onconnectionstatechange')
  pc.onicecandidate = onIceCandidate(id, field)
  pc.ontrack = onAddStream
  return pc
}

const poll = async (id: string, field) => {
  while (true) {
    const data = await post({ id })
    if (data?.[field]) {
      return data
    }
    console.count(`waiting ${field}`)
    await wait()
  }
}

const onIceCandidate = (id, field) =>
  function (event) {
    console.log(`sending ice candidate`, event.candidate)
    if (event.candidate) {
      console.log()
      post({ id, data: { [field]: event.candidate } })
    }
  }

function onAddStream(event) {
  console.log('stream', event)
  //remoteVideo.srcObject = event.streams[0];
  // remoteStream = event.streams[0];
}

const post = async (body) => fetch('/api/rtc', { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json())

const wait = (n = 1000) => new Promise((res) => setTimeout(res, n))
