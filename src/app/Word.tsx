export interface IWord {
  text: string
  written: number
  color?: string
}

export default function Word({ word }: { word: IWord }) {
  const written = word.text.substring(0, word.written).split('')
  const remain = word.text.substring(word.written).split('')
  return (
    <div className="flex justify-center h-10">
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
