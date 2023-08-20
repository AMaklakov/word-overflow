package word_overflow

type Player struct {
	Color string   `json:"color"`
	Ch    chan any `json:"-"`
}

func NewPlayer(color string) *Player {
	return &Player{
		Color: color,
		Ch:    make(chan any, 10),
	}
}
