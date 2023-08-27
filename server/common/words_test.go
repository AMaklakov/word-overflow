package common

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
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
	uniq := make(map[string]bool, 0)
	for _, w := range words {
		uniq[w] = true
	}

	assert.Len(t, words, 30, "should generate words")
	assert.Len(t, uniq, 30, "should all be uniq")
}
