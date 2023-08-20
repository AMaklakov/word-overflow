package word_overflow

const (
	ClientTypeKey     = "key"
	ClientTypeRestart = "restart"
	ClientTypeData    = "data"
	ClientTypeCpm     = "cpm"
)

type ClientMessage struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type GameMessage struct {
	Player  string
	Type    string
	Payload any
}
