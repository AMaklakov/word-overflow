package word_overflow

import (
	"AMaklakov/word-overflow/analyzers"
	"AMaklakov/word-overflow/common"
	"log"
	"time"

	"golang.org/x/exp/slices"
)

type Game struct {
	Id       string            `json:"id"`
	Words    []*Word           `json:"words"`
	Stats    []*Stat           `json:"stats"`
	Players  []*Player         `json:"players"`
	Config   *Config           `json:"config"`
	IsEnd    bool              `json:"isEnd"`
	Timeout  int               `json:"timeout"`
	EventsCh chan *GameMessage `json:"-"`
}

func NewGame(id string, config *Config) *Game {
	game := &Game{
		Id:       id,
		Words:    make([]*Word, 0),
		Stats:    make([]*Stat, 0),
		Players:  make([]*Player, 0),
		Config:   config,
		IsEnd:    false,
		Timeout:  config.Timeout,
		EventsCh: make(chan *GameMessage, 10),
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
	close(g.EventsCh)
	for _, p := range g.Players {
		close(p.Ch)
	}
}

func (g *Game) ProcessEvents() {
	log.Println("Starting listening for events in", g.Id)
	defer log.Println("Ending listening for events in", g.Id)

	for m := range g.EventsCh {
		switch m.Type {
		case ClientTypeKey:
			if !g.canPlay() {
				continue
			}

			key := m.Payload.(string)
			player := g.findPlayer(m.Player)
			if updated := g.processKey(key, m.Player); updated {
				g.NotifyPlayers()
				player.Analyze(key, analyzers.StatusSuccess)
			} else {
				player.Analyze(key, analyzers.StatusError)
			}

		case ClientTypeRestart:
			g.init()
			g.NotifyPlayers()
			go g.Start()
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
	return player
}

func (g *Game) findPlayer(color string) *Player {
	for _, p := range g.Players {
		if p.Color == color {
			return p
		}
	}
	return nil
}

// Used slices because now I'm 😎
func (g *Game) DeletePlayer(color string) (ok bool) {
	i := slices.IndexFunc(g.Players, func(p *Player) bool {
		return p.Color == color
	})
	if i >= 0 {
		close(g.Players[i].Ch)
		g.Players = slices.Delete(g.Players, i, i+1)
		g.NotifyPlayers()
	}
	return len(g.Players) > 0
}

func (g *Game) NotifyPlayers() {
	g.UpdateStats()
	for _, p := range g.Players {
		p.Ch <- &ClientMessage{ClientTypeData, g}
	}
}

// TODO: send game timeout as a separate message
func (g *Game) Start() {
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

	log.Panic("Color limit exceeded")
	return ""
}
