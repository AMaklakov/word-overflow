package word_overflow

type Config struct {
	Words   int `json:"words"`
	Players int `json:"players"`
	Timeout int `json:"timeout"`
}

func NewConfig(modifiers ...func(c *Config)) *Config {
	config := &Config{
		Words:   20,
		Players: 2,
		Timeout: 10,
	}

	for _, f := range modifiers {
		f(config)
	}

	return config
}
