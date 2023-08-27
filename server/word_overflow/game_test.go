package word_overflow

import (
	"AMaklakov/word-overflow/analyzers"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGame(t *testing.T) {
	game := NewGame("1", &Config{
		Words:   20,
		Players: 1,
		Timeout: 0,
	})
	game.Status = statusRunning // Start the game

	word := game.Words[len(game.Words)-1]
	player := game.AddPlayer()
	player.analyzers = make([]analyzers.Analyzer, 0) // reset analyzers so not influence test

	wg := sync.WaitGroup{}

	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < len(word.Text); i++ {
			<-player.Ch
		}
	}()

	for i := 0; i < len(word.Text); i++ {
		game.EventsCh <- &GameMessage{
			Player:  player.Color,
			Type:    ClientTypeKey,
			Payload: string(word.Text[i]),
		}
	}

	wg.Wait()
	assert.Equal(t, true, word.IsFinished(), "word is not written")
}

func TestGameMultiplePlayersSameWord(t *testing.T) {
	N := 5
	wg := sync.WaitGroup{}

	game := NewGame("test game", &Config{Words: 20, Players: N, Timeout: 0})
	game.Status = statusRunning // running the game

	word := game.Words[len(game.Words)-1]

	for i := 0; i < N; i++ {
		wg.Add(1)

		player := game.AddPlayer()
		player.analyzers = make([]analyzers.Analyzer, 0) // reset analyzers

		go func() {
			defer wg.Done()
			for i := 0; i < len(word.Text); i++ {
				<-player.Ch
			}
		}()
	}

	for i := 0; i < N; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			for j := 0; j < len(word.Text); j++ {
				game.EventsCh <- &GameMessage{
					Player:  game.Players[i].Color,
					Type:    ClientTypeKey,
					Payload: string(word.Text[j]),
				}
			}
		}(i)
	}

	wg.Wait()
	assert.Equal(t, true, word.IsFinished())
}

func TestTypeKey(t *testing.T) {
	game := NewGame("1", &Config{Words: 30, Players: 2, Timeout: 0})
	game.Words[20] = &Word{"1Hello", 0, ""}
	game.Words[15] = &Word{"0World", 0, ""}

	for _, l := range strings.Split("11H2e3l4l5o600W00o0rld", "") {
		game.processKey(l, "red")
	}

	for i, word := range game.Words {
		if i == 15 || i == 20 {
			assert.Equal(t, true, word.IsFinished())
			assert.Equal(t, "red", word.Color)
		} else {
			assert.Equal(t, false, word.IsFinished())
			assert.Equal(t, "", word.Color)
		}
	}
}

func BenchmarkTypeKey(b *testing.B) {
	for i := 0; i < b.N; i++ {
		game := NewGame("1", &Config{Words: 30, Players: 2, Timeout: 0})
		game.Words[20] = &Word{"1Hello", 0, ""}
		game.Words[15] = &Word{"0World", 0, ""}
		for _, l := range strings.Split("11H2e3l4l5o600W00o0rld", "") {
			game.processKey(l, "red")
		}
	}
}
