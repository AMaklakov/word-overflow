package word_overflow

import (
	"AMaklakov/word-overflow/common"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
)

func makeRequest(req *http.Request, mods ...func(s *Server)) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	mux := chi.NewRouter()
	server := NewServer()
	server.Group(mux, "")
	for _, f := range mods {
		f(server)
	}
	mux.ServeHTTP(rr, req)
	return rr
}

func TestConcurrentGameWrites(t *testing.T) {
	N := 100
	wg := sync.WaitGroup{}

	server := NewServer()
	for i := 0; i < N; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			config, err := json.Marshal(NewConfig())
			assert.NoError(t, err)

			server.handlePostGame(httptest.NewRecorder(), httptest.NewRequest("POST", "/", bytes.NewReader(config)))
		}()
	}
	wg.Wait()

	assert.Equal(t, N, len(server.state.state))
}

func TestGetGameNoGame(t *testing.T) {
	rr := makeRequest(httptest.NewRequest("GET", "/1234", nil))

	var data common.ApiError
	err := json.Unmarshal(rr.Body.Bytes(), &data)
	assert.NoError(t, err)

	assert.Equal(t, rr.Header().Get("Content-Type"), "application/json")
	assert.Equal(t, http.StatusNotFound, rr.Result().StatusCode)
	assert.Equal(t, "No such game", data.Message)
}

func TestGetGameIsFull(t *testing.T) {
	rr := makeRequest(httptest.NewRequest("GET", "/1234", nil),
		func(s *Server) {
			game := NewGame("1234", NewConfig(func(c *Config) {
				c.Players = 0 // Already full
			}))
			s.state.Set(game)
		})

	var data common.ApiError
	err := json.Unmarshal(rr.Body.Bytes(), &data)

	assert.NoError(t, err)
	assert.Equal(t, rr.Header().Get("Content-Type"), "application/json")
	assert.Equal(t, http.StatusForbidden, rr.Result().StatusCode)
	assert.Equal(t, "Max game connections reached", data.Message)
}

func TestGetGameSuccess(t *testing.T) {
	game := NewGame("1234", NewConfig())

	rr := makeRequest(httptest.NewRequest("GET", "/1234", nil), func(s *Server) {
		s.state.Set(game)
	})

	message, err := json.Marshal(game)

	assert.NoError(t, err)
	assert.Equal(t, rr.Header().Get("Content-Type"), "application/json")
	assert.Equal(t, http.StatusOK, rr.Result().StatusCode)
	assert.Equal(t, string(message)+"\n", rr.Body.String())
}
