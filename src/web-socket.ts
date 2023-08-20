import Ably from 'ably'

const connect = async () => {
  const ably = new Ably.Realtime.Promise('sCp4OA.evR1Nw:j03xy_lqYTmwPrwYHg1aFgxZ4csdWWixiq8NMBkbmTo')
  await ably.connection.once('connected')
  // console.log('Connected to Ably!')
  return ably
}

export const createSocket = (channel: string) => connect().then((r) => r.channels.get(channel))
