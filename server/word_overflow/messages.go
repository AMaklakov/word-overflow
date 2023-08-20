package word_overflow

const (
	TypeKey = "key"
)

type Message struct {
	Player  string
	Type    string
	Payload any
}
