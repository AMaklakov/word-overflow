package word_overflow

import (
	"time"

	"github.com/gorilla/websocket"
)

type Game struct {
	Id      string      `json:"gameId"`
	Words   []*Word     `json:"words"`
	Stats   []*Stat     `json:"stats"`
	Players []*Player   `json:"-"`
	Config  *GameConfig `json:"-"`
	IsEnd   bool        `json:"isEnd"`
	Counter int         `json:"counter"`
}

func NewGame(id string, config *GameConfig) *Game {
	words := make([]*Word, 0, config.Words)
	for _, text := range GenerateWords(config.Words) {
		words = append(words, NewWord(text, ""))
	}
	return &Game{
		Id:      id,
		Players: make([]*Player, 0),
		Words:   words,
		Stats:   make([]*Stat, 0),
		IsEnd:   false,
		Config:  config,
		Counter: config.Timeout,
	}
}

func (g *Game) CanPlay() bool {
	return !g.IsEnd && g.Counter == 0
}

func (g *Game) ProcessKey(key, color string) {
	// is being written by the player
	for _, w := range g.Words {
		if w.IsStartedBy(color) {
			if w.getNextKey() == key {
				w.Written++
			}
			return
		}
	}

	// choosing a new word
	for _, w := range g.Words {
		if w.IsUntouched() && w.getNextKey() == key {
			w.Written++
			w.Color = color
			return
		}
	}
}

func (g *Game) AddPlayer(conn *websocket.Conn) *Player {
	player := NewPlayer(conn, generateColor(g.Players))
	g.Players = append(g.Players, player)
	return player
}

func (g *Game) DeletePlayer(color string) (ok bool) {
	players := make([]*Player, 0, len(g.Players)-1)
	for _, p := range g.Players {
		if p.Color != color {
			players = append(players, p)
		}
	}
	g.Players = players
	return len(g.Players) > 0
}

func (g *Game) WriteToAll(message interface{}) {
	for _, p := range g.Players {
		p.Write(message)
	}
}

func (g *Game) CountDown() {
	if g.Counter != g.Config.Timeout {
		return
	}

	for i := g.Config.Timeout; i > 0; i-- {
		g.Counter--
		g.WriteToAll(Message{DataMessageType, g})
		time.Sleep(time.Second)
	}
}

var Colors = []string{"#00AC11", "#E20101", "#E36D00", "#9000E9", "#F3DB00"}

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
