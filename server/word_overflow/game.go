package word_overflow

import (
	"AMaklakov/word-overflow/common"
	"log"
	"time"
)

type Game struct {
	Id      string        `json:"id"`
	Words   []*Word       `json:"words"`
	Stats   []*Stat       `json:"stats"`
	Players []*Player     `json:"players"`
	Config  *Config       `json:"config"`
	IsEnd   bool          `json:"isEnd"`
	Timeout int           `json:"timeout"`
	Events  chan *Message `json:"-"`
}

func NewGame(id string, config *Config) *Game {
	game := &Game{
		Id:      id,
		Words:   make([]*Word, 0),
		Stats:   make([]*Stat, 0),
		Players: make([]*Player, 0),
		Config:  config,
		IsEnd:   false,
		Timeout: config.Timeout,
		Events:  make(chan *Message, 10),
	}
	game.init()
	return game
}

func (g *Game) init() {
	words := make([]*Word, g.Config.Words)
	for i, text := range common.GenerateWords(g.Config.Words) {
		words[i] = NewWord(text, "")
	}

	g.IsEnd = false
	g.Timeout = g.Config.Timeout
	g.Words = words
	go g.ProcessEvents()
}

func (g *Game) Destroy() {
	close(g.Events)
	for _, p := range g.Players {
		close(p.Ch)
	}
}

func (g *Game) ProcessEvents() {
	defer log.Println("Ending listening")

	for m := range g.Events {
		switch m.Type {
		case TypeKey:
			if !g.canPlay() {
				continue
			}
			if updated := g.processKey(m.Payload.(string), m.Player); updated {
				g.NotifyPlayers()
			}
		case TypeRestart:
			g.init()
			g.NotifyPlayers()
			go g.countDown()
			return
		default:
			log.Fatal("Unsupported message type", m.Type, m)
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
	if g.Timeout != g.Config.Timeout {
		return
	}

	for i := g.Config.Timeout; i > 0; i-- {
		g.Timeout--
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
	return !g.IsEnd && g.Timeout == 0
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
