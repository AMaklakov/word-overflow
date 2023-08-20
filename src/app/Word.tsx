export interface IWord {
  text: string
  written: number
  color?: string
}

export const Words = ({ words }: { words: IWord[] }) => (
  <div className="flex justify-center items-start flex-wrap gap-2">
    {words.map((w) => (
      <Word key={w.text} word={w} />
    ))}
  </div>
)

export function Word({ word }: { word: IWord }) {
  const written = word.text.substring(0, word.written).split('')
  const remain = word.text.substring(word.written).split('')
  const opacity = +(word.text.length !== word.written)
  return (
    <div
      style={{ opacity }}
      className="font-semibold bg-[#F4F4F4] text-[#B1B1B1] text-lg py-1 px-2 rounded-2xl sm:text-xl sm:py-2 sm:px-4 lg:text-2xl lg:py-4 lg:px-8 lg:rounded-3xl xl:text-3xl transition-opacity"
    >
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
