package analyzers

type KeyStatus uint8

const (
	StatusSuccess KeyStatus = iota
	StatusError
)

type Result struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type Analyzer interface {
	Analyze(key string, status KeyStatus) Result
}
