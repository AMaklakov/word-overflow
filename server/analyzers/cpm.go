package analyzers

import (
	"math"
	"time"
)

type CpmAnalyzer struct {
	cpm       int
	count     int
	startDate time.Time
}

func NewCpmAnalyzer() *CpmAnalyzer {
	return &CpmAnalyzer{
		cpm:       0,
		count:     0,
		startDate: time.Time{},
	}
}

func (s *CpmAnalyzer) Analyze(key string, status KeyStatus) Result {
	if s.count == 0 {
		s.startDate = time.Now()
	}

	s.count++
	diff := time.Since(s.startDate).Nanoseconds()
	s.cpm = int(math.Round((float64(s.count) / float64(diff)) * float64(time.Minute)))

	return Result{"cpm", s.cpm}
}
