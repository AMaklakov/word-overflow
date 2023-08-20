package main

import (
	"AMaklakov/word-overflow/word_overflow"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
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
		sendError(w, http.StatusBadRequest, "Request body is not valid")
		return
	}

	game := word_overflow.NewGame(gameId, &config)
	Games[gameId] = game

	sendJSON(w, http.StatusOK, game)
}

func GetGame(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game, ok := Games[gameId]
	if !ok || !game.CanJoin() {
		sendError(w, http.StatusNotFound, "No such game")
		return
	}

	sendJSON(w, http.StatusOK, game)
}

func GetSocket(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game, ok := Games[gameId]

	// Create a new game if needed
	if !ok {
		sendError(w, http.StatusNotFound, "No such game")
		return
	}

	// Already full, rejecting
	if !game.CanJoin() {
		sendError(w, http.StatusForbidden, "Max game connections reached")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Cannot upgrade connection to WS")
		return
	}

	player := game.AddPlayer(conn)

	defer func() {
		err := conn.Close()
		if err != nil {
			fmt.Printf("err closing connection: %v\n", err)
		}

		ok := game.DeletePlayer(player.Color)
		if ok {
			game.UpdateStats()
			game.WriteToAll(word_overflow.Message{word_overflow.DataMessageType, game})
		} else {
			log.Println("Deleting game ", gameId)
			delete(Games, gameId)
		}
	}()

	// If the last required to connect
	if game.Config.Players == len(game.Players) {
		go game.CountDown()
	}

	for {
		var message word_overflow.Message
		err := conn.ReadJSON(&message)
		if err != nil {
			sendError(w, http.StatusBadRequest, "Message is not valid")
			return
		}

		// fmt.Printf("message: %v\n", message)

		switch message.Type {
		case word_overflow.KeyMessageType:
			if game.CanPlay() {
				game.ProcessKey(message.Data.(string), player.Color)
				game.UpdateStats()
				game.WriteToAll(word_overflow.Message{word_overflow.DataMessageType, game})
			}

		default:
			log.Println("Unsupported message type", message)
		}
	}
}
