import { useEffect, useMemo } from 'react'
import { useObservableState } from 'observable-hooks'
import { BehaviorSubject } from 'rxjs'
import { createSocket as createStream } from './web-socket'
import { Types } from 'ably'

enum Messages {
  Offer = 'offer',
  Answer = 'answer',
  ReadyForConnection = 'readyCreate',
  ReadyForCreation = 'readyConnect',
  CandidateOffer = 'candidateOffer',
  CandidateAnswer = 'candidateAnswer',
}

const CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }],
}

export const useRTC = (channelId: string, type: 'create' | 'connect') => {
  const channel$ = useMemo(() => new BehaviorSubject<RTCDataChannel | null>(null), [])
  useEffect(() => {
    let connection: Types.RealtimeChannelPromise | null = null
    const fn = type === 'create' ? createRTCConnection : connectToRTC
    fn(channelId, channel$).then((c) => {
      connection = c
    })
    return () => {
      connection?.detach()
    }
  }, [channel$, channelId, type])
  return useObservableState(channel$)
}

const createRTCConnection = async (id: string, channel$: BehaviorSubject<RTCDataChannel | null>) => {
  let dc: RTCDataChannel | null

  const stream = await createStream(id)
  const pc = new RTCPeerConnection(CONFIG)
  // pc.onconnectionstatechange = console.log.bind(null, 'onconnectionstatechange')
  pc.onicecandidate = (event) => {
    event.candidate && stream.publish(Messages.CandidateOffer, event.candidate.toJSON())
  }
  pc.ontrack = (event) => {
    console.log('on add stream', event)
  }

  await stream.subscribe(Messages.Answer, (message) => {
    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.data)))
  })
  await stream.subscribe(Messages.CandidateAnswer, (message) => {
    pc.addIceCandidate(new RTCIceCandidate(message.data))
    if (dc) {
      channel$.next(dc)
    }
  })

  await stream.subscribe(Messages.ReadyForConnection, async (message) => {
    // ! Order of creation is important
    dc = pc.createDataChannel(id, { ordered: true })

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    await stream.publish(Messages.Offer, JSON.stringify(offer))
  })
  await stream.publish(Messages.ReadyForCreation, {})

  return stream
}

const connectToRTC = async (id: string, channel$: BehaviorSubject<RTCDataChannel | null>) => {
  const stream = await createStream(id)
  const pc = new RTCPeerConnection(CONFIG)
  // pc.onconnectionstatechange = console.log.bind(null, 'onconnectionstatechange')
  pc.onicecandidate = (event) => {
    event.candidate && stream.publish(Messages.CandidateAnswer, event.candidate.toJSON())
  }
  pc.ontrack = (event) => {
    console.log('on add stream', event)
  }
  pc.ondatachannel = (event) => {
    // the most important code
    event.channel.onclosing = console.warn
    event.channel.onerror = console.error
    channel$.next(event.channel)
  }
  await stream.subscribe(Messages.Offer, async (message) => {
    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.data)))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    stream.publish(Messages.Answer, JSON.stringify(answer))
  })
  await stream.subscribe(Messages.CandidateOffer, (message) => {
    pc.addIceCandidate(new RTCIceCandidate(message.data))
  })
  await stream.subscribe(Messages.ReadyForCreation, () => stream.publish(Messages.ReadyForConnection, {}))
  await stream.publish(Messages.ReadyForConnection, {})

  return stream
}
