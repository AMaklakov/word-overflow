import Ably from 'ably'

const MIN = 60 * 1000

const ROOT = 'sCp4OA.evR1Nw:j03xy_lqYTmwPrwYHg1aFgxZ4csdWWixiq8NMBkbmTo'
const SUB = 'sCp4OA.igNx6A:lR5UT5avMeoOdVmg_j2O0Xtds2etiRFY_gNj6v2_5go'

enum Channels {
  CreatedGames = 'created-games', // no message type
}

const connections: Map<string, Ably.Types.RealtimePromise> = new Map()

const connect = async (key: string) => {
  if (!connections.has(key)) {
    console.log('Creating a new connection!')
    const ably = new Ably.Realtime.Promise(key)
    await ably.connection.once('connected')
    connections.set(key, ably)
  }
  return connections.get(key)!
}

export const getSocketChannel = (channel: string, key: string = ROOT) =>
  connect(key).then((r) => r.channels.get(channel))

export const getCreatedGames = async () => {
  const channel = await getSocketChannel(Channels.CreatedGames)
  const messages = await channel.history({ start: Date.now() - 5 * MIN })
  return messages.items.map((x) => x.data)
}

export const publishGame = async (name: string) => {
  const channel = await getSocketChannel(Channels.CreatedGames)
  return channel.publish({ data: name })
}
