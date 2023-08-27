package word_overflow

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConcurrentGameWrites(t *testing.T) {
	N := 100
	wg := sync.WaitGroup{}

	server := NewServer()
	for i := 0; i < N; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			config, err := json.Marshal(NewConfig())
			if err != nil {
				assert.Fail(t, err.Error())
			}

			server.handlePostGame(httptest.NewRecorder(), httptest.NewRequest("POST", "/", bytes.NewReader(config)))
		}()
	}
	wg.Wait()

	assert.Equal(t, N, len(server.state.state))
}
