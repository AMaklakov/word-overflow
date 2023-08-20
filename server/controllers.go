package main

import (
	"AMaklakov/word-overflow/word_overflow"
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

const (
	ID_LENGTH = 4
)

var Games = make(map[string]*word_overflow.Game, 0)

func CreateGame(w http.ResponseWriter, r *http.Request) {
	gameId := getId(ID_LENGTH)
	for Games[gameId] != nil {
		gameId = getId(ID_LENGTH)
	}

	var config word_overflow.GameConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		WriteError(w, http.StatusBadRequest, "Request body is not valid")
		return
	}

	game := word_overflow.NewGame(gameId, &config)
	Games[gameId] = game

	WriteJSON(w, http.StatusOK, game)
}

func GetGame(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game := Games[gameId]

	if game == nil {
		WriteError(w, http.StatusNotFound, "No such game")
		return
	}

	if !game.CanJoin() {
		WriteError(w, http.StatusForbidden, "Max game connections reached")
		return
	}

	WriteJSON(w, http.StatusOK, game)
}

func GetSocket(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game := Games[gameId]

	// Create a new game if needed
	if game == nil {
		WriteError(w, http.StatusNotFound, "No such game")
		return
	}
	// Already full, rejecting
	if !game.CanJoin() {
		WriteError(w, http.StatusForbidden, "Max game connections reached")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Cannot upgrade connection to WS")
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
		var message Message
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Println("Player message is not valid, closing connection ", err)
			return
		}

		switch message.Type {
		case KeyMessageType:
			game.Events <- &word_overflow.Message{
				Player:  player.Color,
				Type:    word_overflow.TypeKey,
				Payload: message.Data,
			}

		default:
			log.Println("Unsupported message type", message)
		}
	}
}

func ListenAndSendMessages(ch <-chan any, conn *websocket.Conn) {
	for msg := range ch {
		if err := conn.WriteJSON(Message{DataMessageType, msg}); err != nil {
			log.Println("Failed to write to conn: ", msg)
		}
	}
}
