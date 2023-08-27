package word_overflow

import (
	"AMaklakov/word-overflow/analyzers"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGame(t *testing.T) {
	game := NewGame("1", &Config{Words: 20, Players: 1, Timeout: 0})
	game.Status = statusRunning // Start the game

	word := game.Words[len(game.Words)-1]
	player := game.AddPlayer()
	player.analyzers = make([]analyzers.Analyzer, 0) // reset analyzers not to influence on test

	wg := sync.WaitGroup{}

	wg.Add(1)
	go func() {
		defer wg.Done()
		for range player.Ch {
			// wait for player channel to close
		}
	}()

	for i := 0; i < len(word.Text); i++ {
		game.EventsCh <- &GameMessage{
			Player:  player.Color,
			Type:    ClientTypeKey,
			Payload: string(word.Text[i]),
		}
	}
	close(game.EventsCh) // close the channel => close all players channels

	wg.Wait()
	assert.Equal(t, true, word.IsFinished(), "word is not written")
}

func TestGameMultiplePlayersSameWord(t *testing.T) {
	N := 5

	game := NewGame("test game", &Config{Words: 20, Players: N, Timeout: 0})
	game.Status = statusRunning // running the game

	word := game.Words[len(game.Words)-1]

	wgPlayers := sync.WaitGroup{}
	for i := 0; i < N; i++ {
		wgPlayers.Add(1)

		player := game.AddPlayer()
		player.analyzers = make([]analyzers.Analyzer, 0) // reset analyzers

		go func() {
			defer wgPlayers.Done()
			for range player.Ch {
				// wait for player channel to close
			}
		}()
	}

	wgGame := sync.WaitGroup{}
	for i := 0; i < N; i++ {
		wgGame.Add(1)
		go func(i int) {
			defer wgGame.Done()
			for j := 0; j < len(word.Text); j++ {
				game.EventsCh <- &GameMessage{
					Player:  game.Players[i].Color,
					Type:    ClientTypeKey,
					Payload: string(word.Text[j]),
				}
			}
		}(i)
	}

	wgGame.Wait()
	close(game.EventsCh)

	wgPlayers.Wait()
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

func TestDeletePlayer(t *testing.T) {
	game := NewGame("test", &Config{Words: 10, Players: 2, Timeout: 0})

	p1 := game.AddPlayer()
	p2 := game.AddPlayer()

	hasPlayers := game.DeletePlayer(p1.Color)
	assert.Equal(t, true, hasPlayers, "should have 1 player")
	assert.Equal(t, 1, len(game.Players))
	assert.Equal(t, p2.Color, game.Players[0].Color)

	for range p1.Ch {
	}

	_, ok := <-p1.Ch
	assert.Equal(t, false, ok, "should close channel")
}

func TestStartGame(t *testing.T) {
	timeout := 3
	game := NewGame("test", &Config{Words: 10, Players: 1, Timeout: timeout})
	player := game.AddPlayer()

	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		for m := range player.Ch {
			if data, ok := m.Data.(Game); ok && data.Timeout == 0 {
				return
			}
		}
	}()

	assert.Equal(t, game.Status, statusIdle, "should not start the game")
	wg.Add(1)
	go func() {
		defer wg.Done()
		game.Start()
		assert.Equal(t, game.Status, statusRunning, "should start the game")
	}()

	wg.Wait()
	assert.Equal(t, game.Status, statusRunning, "should start the game")

	now := time.Now()
	game.Start()
	assert.Equal(t, game.Timeout, 0, "should not change anything")
	assert.True(t, time.Since(now) < time.Second*2, "should not run loop")
}

func TestRestartMessage(t *testing.T) {
	game := NewGame("test", &Config{Words: 10, Players: 1, Timeout: 2})

	// mutate the state somehow
	game.Status = statusFinished
	game.Timeout = 0

	p := game.AddPlayer()
	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			select {
			case m := <-p.Ch:
				if data, ok := m.Data.(Game); ok && data.Timeout == 1 {
					return
				}
			case <-time.NewTimer(time.Second * 5).C:
				assert.FailNow(t, "Not received proper message")
				return
			}
		}
	}()

	game.EventsCh <- &GameMessage{
		Player:  p.Color,
		Type:    ClientTypeRestart,
		Payload: nil,
	}

	wg.Wait()
	assert.Equal(t, statusRunning, game.Status)
}
