package word_overflow

type GameConfig struct {
	Words   int
	Players int
	Timeout int
}

func NewDefaultConfig() *GameConfig {
	return &GameConfig{
		Words:   2,
		Players: 2,
		Timeout: 10,
	}
}
