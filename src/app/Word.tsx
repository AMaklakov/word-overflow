export interface IWord {
  text: string
  written: number
  color?: string
}

export function Words({ words }: { words: IWord[] }) {
  return (
    <div className="flex justify-start items-start flex-wrap gap-2">
      {words.map((w) => (
        <Word key={w.text} word={w} />
      ))}
    </div>
  )
}

export function Word({ word }: { word: IWord }) {
  const written = word.text.substring(0, word.written).split('')
  const remain = word.text.substring(word.written).split('')
  return (
    <div className="font-semibold text-2xl bg-[#F4F4F4] text-[#B1B1B1] py-4 px-8 rounded-3xl">
      {written.map((x, i) => (
        <span key={x + i} style={{ color: word.color }}>
          {x}
        </span>
      ))}
      {remain.map((x, i) => (
        <span key={x + i}>{x}</span>
      ))}
    </div>
  )
}
