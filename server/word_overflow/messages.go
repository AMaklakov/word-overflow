package word_overflow

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

const (
	StartGameMessageType = "start"
	KeyMessageType       = "key"
	RestartMessageType   = "restart"
	DataMessageType      = "data"
	// TimerMessageType     = "timer"
)

type KeyMessage struct {
	Key string `json:"key"`
}
