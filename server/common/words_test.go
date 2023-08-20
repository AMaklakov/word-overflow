package common

import (
	"fmt"
	"testing"
)

func BenchmarkWordGeneration(b *testing.B) {
	b.Run(fmt.Sprint(30, " words"), func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			GenerateWords(30)
		}
	})
}

func TestWordGeneration(t *testing.T) {
	words := GenerateWords(30)

	if len(words) != 30 {
		t.Errorf("got %q, wanted %q", len(words), 30)
	}

	m := make(map[string]bool, 0)
	for _, w := range words {
		_, ok := m[w]
		if ok {
			t.Errorf("Not unique")
			return
		}
		m[w] = true
	}

}
