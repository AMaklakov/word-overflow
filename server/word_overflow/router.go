package word_overflow

import (
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gorilla/websocket"
)

type globalState struct {
	mu    sync.RWMutex
	state map[string]*Game
}

func (s *globalState) Get(id string) *Game {
	s.mu.RLock()
	defer s.mu.RUnlock()

	game := s.state[id]
	return game
}

func (g *globalState) Set(game *Game) {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.state[game.Id] = game
}

func (g *globalState) Delete(id string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	delete(g.state, id)
}

type Server struct {
	state    *globalState
	upgrader websocket.Upgrader
}

func NewServer() *Server {
	return &Server{
		state: &globalState{
			mu:    sync.RWMutex{},
			state: make(map[string]*Game),
		},
		upgrader: websocket.Upgrader{
			ReadBufferSize:  0,
			WriteBufferSize: 0,
			CheckOrigin: func(r *http.Request) bool {
				return true // Пропускаем любой запрос
			},
		},
	}
}

func (s *Server) Group(r *chi.Mux, prepend string) {
	r.Group(func(r chi.Router) {
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

		r.Route("/"+prepend, func(r chi.Router) {
			r.Post("/", s.handlePostGame)
			r.Get("/{id}", s.handleGetGame)
			r.Get("/{id}/ws", s.handleGetSocket)
		})
	})
}
