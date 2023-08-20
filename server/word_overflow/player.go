package word_overflow

import "AMaklakov/word-overflow/analyzers"

type Player struct {
	Color     string              `json:"color"`
	Ch        chan *ClientMessage `json:"-"`
	analyzers []analyzers.Analyzer
}

func NewPlayer(color string) *Player {
	return &Player{
		Color: color,
		Ch:    make(chan *ClientMessage, 10),
		analyzers: []analyzers.Analyzer{
			analyzers.NewCpmAnalyzer(),
			analyzers.NewTyposAnalyzer(),
		},
	}
}

func (p *Player) Analyze(key string, status analyzers.KeyStatus) {
	for _, a := range p.analyzers {
		message := ClientMessage(a.Analyze(key, status))
		p.Ch <- &message
	}
}
