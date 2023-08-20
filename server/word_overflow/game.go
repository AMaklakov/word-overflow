package word_overflow

import (
	"log"
	"time"
)

type Game struct {
	Id      string        `json:"id"`
	Words   []*Word       `json:"words"`
	Stats   []*Stat       `json:"stats"`
	Players []*Player     `json:"players"`
	Config  *GameConfig   `json:"-"`
	IsEnd   bool          `json:"isEnd"`
	Counter int           `json:"counter"`
	Events  chan *Message `json:"-"`
}

func NewGame(id string, config *GameConfig) *Game {
	words := make([]*Word, 0, config.Words)
	for _, text := range GenerateWords(config.Words) {
		words = append(words, NewWord(text, ""))
	}
	game := &Game{
		Id:      id,
		Words:   words,
		Stats:   make([]*Stat, 0),
		Players: make([]*Player, 0),
		Config:  config,
		IsEnd:   false,
		Counter: config.Timeout,
		Events:  make(chan *Message, 10),
	}

	go game.ProcessEvents()
	return game
}

func (g *Game) Destroy() {
	close(g.Events)
	for _, p := range g.Players {
		close(p.Ch)
	}
}

func (g *Game) ProcessEvents() {
	for m := range g.Events {
		if !g.canPlay() {
			continue
		}

		var updated bool

		switch m.Type {
		case TypeKey:
			updated = g.processKey(m.Payload.(string), m.Player)
		default:
			log.Fatal("Unsupported message type", m.Type, m)
		}

		if updated {
			g.NotifyPlayers()
		}
	}
}

func (g *Game) CanJoin() bool {
	return len(g.Players) < g.Config.Players
}

func (g *Game) AddPlayer() *Player {
	player := NewPlayer(generateColor(g.Players))
	g.Players = append(g.Players, player)
	g.NotifyPlayers()

	// If the last required connection, start the game
	if !g.CanJoin() {
		go g.countDown()
	}

	return player
}

func (g *Game) DeletePlayer(color string) (ok bool) {
	players := make([]*Player, 0, len(g.Players)-1)
	for _, p := range g.Players {
		if p.Color == color {
			close(p.Ch)
		} else {
			players = append(players, p)
		}
	}
	g.Players = players
	g.NotifyPlayers()
	return len(g.Players) > 0
}

func (g *Game) NotifyPlayers() {
	g.UpdateStats()
	for _, p := range g.Players {
		p.Ch <- g
	}
}

func (g *Game) countDown() {
	if g.Counter != g.Config.Timeout {
		return
	}

	for i := g.Config.Timeout; i > 0; i-- {
		g.Counter--
		g.NotifyPlayers()
		time.Sleep(time.Second)
	}
}

func (g *Game) processKey(key, color string) bool {
	// is being written by the player
	for _, w := range g.Words {
		if w.IsStartedBy(color) {
			if w.getNextKey() == key {
				w.Written++
				return true
			}
			return false
		}
	}
	// choosing a new word
	for _, w := range g.Words {
		if w.IsUntouched() && w.getNextKey() == key {
			w.Written++
			w.Color = color
			return true
		}
	}
	// Nothing is updated
	return false
}

func (g *Game) canPlay() bool {
	return !g.IsEnd && g.Counter == 0
}

var Colors = []string{
	"#00AC11",
	"#E20101",
	"#E36D00",
	"#9000E9",
	"#F3DB00",
}

func generateColor(players []*Player) string {
colorsLoop:
	for _, color := range Colors {
		for _, player := range players {
			if player.Color == color {
				continue colorsLoop
			}
		}
		return color
	}

	panic("Color limit exceeded")
}
