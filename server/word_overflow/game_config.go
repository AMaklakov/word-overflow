package word_overflow

type GameConfig struct {
	Words   int `json:"words"`
	Players int `json:"players"`
	Timeout int `json:"timeout"`
}

func NewDefaultConfig() *GameConfig {
	return &GameConfig{
		Words:   20,
		Players: 2,
		Timeout: 10,
	}
}
