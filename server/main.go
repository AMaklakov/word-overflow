package main

import (
	"AMaklakov/word-overflow/word_overflow"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  0,
	WriteBufferSize: 0,
	CheckOrigin: func(r *http.Request) bool {
		return true // Пропускаем любой запрос
	},
}

var Games = make(map[string]*word_overflow.Game, 0)

func main() {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"https://*", "http://*"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Route("/words-overflow", func(r chi.Router) {
		r.Post("/", CreateGame)
		r.Get("/{id}", GetGame)
		r.Get("/{id}/ws", GetSocket)
	})

	http.ListenAndServe(":5123", r)
}

const ID_LENGTH = 4

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

	writeGame(w, game)
}

func GetGame(w http.ResponseWriter, r *http.Request) {
	gameId := chi.URLParam(r, "id")
	game, ok := Games[gameId]
	if !ok || !game.CanJoin() {
		sendError(w, http.StatusNotFound, "No such game")
		return
	}

	writeGame(w, game)
}

func writeGame(w http.ResponseWriter, game *word_overflow.Game) {
	w.WriteHeader(http.StatusOK)
	if body, err := json.Marshal(game); err == nil {
		w.Write(body)
	} else {
		fmt.Printf("err: %v\n", err)
	}
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
			fmt.Println("Unsupported datatype", message)
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
