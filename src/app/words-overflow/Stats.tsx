import { IWord } from './Word'

interface Stat {
  color: string
  words: IWord[]
}
export type IStats = Stat[]

export default function Stats({ stats }: { stats?: IStats | null }) {
  if (!stats) {
    return null
  }

  return (
    <div className="absolute p-5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white flex flex-col gap-2 border-white border-2 rounded-xl">
      <h1 className="mb-5 text-white">Congratulations!</h1>
      {stats.map((s, i) => (
        <div key={i} className="flex justify-between">
          <span style={{ color: s.color }} className="font-bold">
            Player {i + 1}
          </span>
          <span className="font-bold">{s.words.length} words</span>
        </div>
      ))}
      <h3 className="text-white">Refresh the page to restart</h3>
    </div>
  )
}
