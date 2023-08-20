package word_overflow

type Config struct {
	Words   int `json:"words"`
	Players int `json:"players"`
	Timeout int `json:"timeout"`
}

func NewDefaultConfig() *Config {
	return &Config{
		Words:   20,
		Players: 2,
		Timeout: 10,
	}
}
