package word_overflow

import (
	"fmt"

	"github.com/gorilla/websocket"
)

type Player struct {
	Color string
	Conn  *websocket.Conn
}

func NewPlayer(conn *websocket.Conn, color string) *Player {
	return &Player{
		Color: color,
		Conn:  conn,
	}
}

func (p *Player) Write(message interface{}) {
	if err := p.Conn.WriteJSON(message); err != nil {
		fmt.Printf("write to client error: %v\n", err)
	}
}
