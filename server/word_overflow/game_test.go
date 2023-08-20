package word_overflow

import (
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGame(t *testing.T) {
	game := NewGame("1", &GameConfig{
		Words:   20,
		Players: 1,
		Timeout: 0,
	})
	word := game.Words[len(game.Words)-1]
	player := game.AddPlayer()
	wg := sync.WaitGroup{}

	wg.Add(1)
	go func() {
		for i := 0; i < len(word.Text); i++ {
			<-player.Ch
		}
		wg.Done()
	}()

	for i := 0; i < len(word.Text); i++ {
		game.Events <- &Message{
			Player:  player.Color,
			Type:    TypeKey,
			Payload: string(word.Text[i]),
		}
	}

	wg.Wait()
	if !word.IsFinished() {
		t.Error("Word is not written", word.Text, word.Written)
	}
}

func TestGameMultiplePlayersSameWord(t *testing.T) {
	N := 5
	wg := sync.WaitGroup{}

	game := NewGame("1", &GameConfig{Words: 20, Players: 2, Timeout: 0})
	word := game.Words[len(game.Words)-1]

	for i := 0; i < N; i++ {
		player := game.AddPlayer()
		wg.Add(1)
		go func() {
			for i := 0; i < len(word.Text); i++ {
				<-player.Ch
			}
			wg.Done()
		}()
	}

	for i := 0; i < N; i++ {
		wg.Add(1)
		go func(i int) {
			for j := 0; j < len(word.Text); j++ {
				game.Events <- &Message{
					Player:  game.Players[i].Color,
					Type:    TypeKey,
					Payload: string(word.Text[j]),
				}
			}
			wg.Done()
		}(i)
	}

	wg.Wait()
	assert.Equal(t, true, word.IsFinished())
}

func TestTypeKey(t *testing.T) {
	game := NewGame("1", &GameConfig{Words: 30, Players: 2, Timeout: 0})
	game.Words[20] = &Word{"1Hello", 0, ""}
	game.Words[15] = &Word{"0World", 0, ""}

	for _, l := range strings.Split("11H2e3l4l5o600W00o0rld", "") {
		game.processKey(l, "red")
	}

	for i, word := range game.Words {
		color, finished := "", false
		if i == 15 || i == 20 {
			color, finished = "red", true
		}
		assert.Equal(t, finished, word.IsFinished())
		assert.Equal(t, color, word.Color)
	}
}

func BenchmarkTypeKey(b *testing.B) {
	for i := 0; i < b.N; i++ {
		game := NewGame("1", &GameConfig{Words: 30, Players: 2, Timeout: 0})
		game.Words[20] = &Word{"1Hello", 0, ""}
		game.Words[15] = &Word{"0World", 0, ""}
		for _, l := range strings.Split("11H2e3l4l5o600W00o0rld", "") {
			game.processKey(l, "red")
		}
	}
}
