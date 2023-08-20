package analyzers

type TyposAnalyzer struct {
	typos int
}

func NewTyposAnalyzer() *TyposAnalyzer {
	return &TyposAnalyzer{typos: 0}
}

func (s *TyposAnalyzer) Analyze(key string, status KeyStatus) Result {
	if status == StatusError {
		s.typos++
	}
	return Result{"typos", s.typos}
}
