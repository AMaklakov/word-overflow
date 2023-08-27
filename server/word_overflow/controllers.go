package word_overflow

import (
	"AMaklakov/word-overflow/common"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

const (
	ID_LENGTH = 4
)

var stateLock sync.RWMutex = sync.RWMutex{}
var State = make(globalState, 0)

type globalState map[string]*Game

func (g globalState) Get(id string) *Game {
	stateLock.RLock()
	defer stateLock.RUnlock()

	game := g[id]
	return game
}

func (g globalState) Set(game *Game) {
	stateLock.Lock()
	defer stateLock.Unlock()

	g[game.Id] = game
}

func (g globalState) Delete(id string) {
	stateLock.Lock()
	defer stateLock.Unlock()

	delete(g, id)
}

func handlePostGame(w http.ResponseWriter, r *http.Request) {
	gameId := getId(ID_LENGTH)
	for State.Get(gameId) != nil {
		gameId = getId(ID_LENGTH)
	}

	var config Config
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		common.WriteError(w, http.StatusBadRequest, "Request body is not valid "+err.Error())
		return
	}

	game := NewGame(gameId, &config)
	State.Set(game)

	common.WriteJSON(w, http.StatusOK, game)
}

func handleGetGame(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game := State.Get(gameId)

	if game == nil {
		common.WriteError(w, http.StatusNotFound, "No such game")
		return
	}

	if !game.CanJoin() {
		common.WriteError(w, http.StatusForbidden, "Max game connections reached")
		return
	}

	common.WriteJSON(w, http.StatusOK, game)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  0,
	WriteBufferSize: 0,
	CheckOrigin: func(r *http.Request) bool {
		return true // Пропускаем любой запрос
	},
}

func handleGetSocket(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game := State.Get(gameId)

	// Create a new game if needed
	if game == nil {
		common.WriteError(w, http.StatusNotFound, "No such game")
		return
	}
	// Already full, rejecting
	if !game.CanJoin() {
		common.WriteError(w, http.StatusForbidden, "Max game connections reached")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		common.WriteError(w, http.StatusInternalServerError, "Cannot upgrade connection to WS")
		return
	}

	player := game.AddPlayer()
	go func() {
		for msg := range player.Ch {
			if err := conn.WriteJSON(msg); err != nil {
				log.Println("Failed to write to conn: ", msg)
			}
		}
	}()

	defer func() {
		err := conn.Close()
		if err != nil {
			log.Printf("err closing connection: %v\n", err)
		}
		if hasPlayers := game.DeletePlayer(player.Color); !hasPlayers {
			log.Println("Deleting game ", gameId)
			game.Destroy()
			State.Delete(gameId)
		}
	}()

	// If the last required connection, start the game
	if !game.CanJoin() {
		go game.Start()
	}

	for {
		var message ClientMessage
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Println("Player message is not valid, closing connection ", err)
			return
		}

		// TODO: can we make it better?
		switch message.Type {
		case ClientTypeKey:
			game.EventsCh <- &GameMessage{
				Player:  player.Color,
				Type:    ClientTypeKey,
				Payload: message.Data,
			}
		case ClientTypeRestart:
			game.EventsCh <- &GameMessage{
				Player: player.Color,
				Type:   ClientTypeRestart,
			}
		default:
			log.Println("Unsupported message type", message)
		}
	}
}

func getId(length int) string {
	characters := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	id := make([]byte, 0, length)
	for i := 0; i < length; i++ {
		id = append(id, characters[rand.Intn(len(characters))])
	}
	return string(id)
}
