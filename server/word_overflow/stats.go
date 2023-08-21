package word_overflow

type Stat struct {
	Color string  `json:"color"`
	Words []*Word `json:"words"`
}

func (g *Game) UpdateStats() {
	totalWritten := 0
	stats := make([]*Stat, 0, len(g.Players))
	for _, p := range g.Players {
		words := make([]*Word, 0, len(g.Words))
		for _, word := range g.Words {
			if word.IsWrittenBy(p.Color) {
				words = append(words, word)
				if word.IsFinished() {
					totalWritten++
				}
			}
		}

		stats = append(stats, &Stat{Color: p.Color, Words: words})
	}
	g.Stats = stats
	if totalWritten == len(g.Words) {
		g.Status = statusFinished
	}
}
