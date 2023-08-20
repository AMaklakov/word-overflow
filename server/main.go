package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"A.Maklakov/word-overflow/word_overflow"
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

	// r.Route("/games", func(r chi.Router) {
	// 	r.Post("/", GetGames)
	// })
	r.Get("/ws", Websockets)

	http.ListenAndServe(":5123", r)
}

// func GetGames(w http.ResponseWriter, r *http.Request) {
// 	data, err := json.Marshal(DB.GetGames())
// 	if err != nil {
// 		w.WriteHeader(http.StatusInternalServerError)
// 		return
// 	}
// 	w.Write(data)
// }

func Websockets(w http.ResponseWriter, r *http.Request) {
	gameId := r.URL.Query().Get("gameId")
	game, ok := Games[gameId]

	// Create a new game if needed
	if !ok {
		game = word_overflow.NewGame(gameId, word_overflow.NewDefaultConfig())
		Games[gameId] = game
	}

	// Already full, rejecting
	if game.Config.Players == len(game.Players) {
		w.WriteHeader(http.StatusForbidden)
		if message, err := json.Marshal(struct{ Error string }{Error: "Max connections reached"}); err == nil {
			w.Write(message)
		}
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
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
			fmt.Printf("err: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		fmt.Printf("message: %v\n", message)

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
