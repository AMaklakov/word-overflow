package word_overflow

import (
	"AMaklakov/word-overflow/common"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

const (
	ID_LENGTH = 4
)

var Games = make(map[string]*Game, 0)

func CreateGame(w http.ResponseWriter, r *http.Request) {
	gameId := getId(ID_LENGTH)
	for Games[gameId] != nil {
		gameId = getId(ID_LENGTH)
	}

	var config Config
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		common.WriteError(w, http.StatusBadRequest, "Request body is not valid")
		return
	}

	game := NewGame(gameId, &config)
	Games[gameId] = game

	common.WriteJSON(w, http.StatusOK, game)
}

func GetGame(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game := Games[gameId]

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

func GetSocket(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game := Games[gameId]

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
	go ListenAndSendMessages(player.Ch, conn)

	defer func() {
		err := conn.Close()
		if err != nil {
			log.Printf("err closing connection: %v\n", err)
		}

		hasPlayers := game.DeletePlayer(player.Color)
		if !hasPlayers {
			log.Println("Deleting game ", gameId)
			game.Destroy()
			delete(Games, gameId)
		}
	}()

	for {
		var message ClientMessage
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Println("Player message is not valid, closing connection ", err)
			return
		}

		switch message.Type {
		case ClientTypeKey:
			game.EventsCh <- &Message{
				Player:  player.Color,
				Type:    ClientTypeKey,
				Payload: message.Data,
			}
		case ClientTypeRestart:
			game.EventsCh <- &Message{
				Player: player.Color,
				Type:   ClientTypeRestart,
			}
		default:
			log.Println("Unsupported message type", message)
		}
	}
}

func ListenAndSendMessages(ch <-chan *ClientMessage, conn *websocket.Conn) {
	for msg := range ch {
		if err := conn.WriteJSON(msg); err != nil {
			log.Println("Failed to write to conn: ", msg)
		}
	}
}

type ClientMessage struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type KeyMessage struct {
	Key string `json:"key"`
}

func getId(length int) string {
	characters := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	id := make([]byte, 0, length)
	for i := 0; i < length; i++ {
		id = append(id, characters[rand.Intn(len(characters))])
	}
	return string(id)
}
