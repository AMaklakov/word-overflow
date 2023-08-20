package word_overflow

const (
	TypeKey     = "key"
	TypeRestart = "restart"
	TypeData    = "data"
)

type Message struct {
	Player  string
	Type    string
	Payload any
}
