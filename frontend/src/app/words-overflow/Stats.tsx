import { IWord } from './Word'

interface Stat {
  color: string
  words: IWord[]
}
export type IStats = Stat[]

export const GameOver = ({
  stats,
  onEnd,
  onRestart,
}: {
  stats: IStats
  onEnd?: () => void
  onRestart?: () => void
}) => (
  <div className="absolute p-5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white flex flex-col gap-2 border-white border-2 rounded-xl z-50">
    <h1 className="mb-5 text-white">Congratulations!</h1>
    {stats.map((s, i) => (
      <div key={i} className="flex justify-between">
        <span style={{ color: s.color }} className="font-bold">
          Player {i + 1}
        </span>
        <span className="font-bold">{s.words.length} words</span>
      </div>
    ))}
    <div className="flex justify-between font-bold">
      {onEnd && (
        <button className="uppercase" onClick={onEnd}>
          Exit
        </button>
      )}
      {onRestart && (
        <button className="uppercase" onClick={onRestart}>
          Play Again
        </button>
      )}
    </div>
  </div>
)

export const Stats = ({ stats }: { stats: IStats }) => (
  <div className="absolute left-0 right-0 bottom-5 flex justify-between text-3xl px-5 font-mono">
    {stats.map((s) => (
      <span key={s.color} style={{ color: s.color }}>
        {s.words.length}
      </span>
    ))}
  </div>
)
