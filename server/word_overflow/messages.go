package word_overflow

const (
	ClientTypeKey     = "key"
	ClientTypeRestart = "restart"
	ClientTypeData    = "data"
	ClientTypeCpm     = "cpm"
)

type Message struct {
	Player  string
	Type    string
	Payload any
}
