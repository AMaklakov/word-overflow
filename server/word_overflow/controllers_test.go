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
	gamesToCreate := 100

	var wg sync.WaitGroup
	for i := 0; i < gamesToCreate; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			config, err := json.Marshal(NewConfig())
			if err != nil {
				assert.Fail(t, err.Error())
			}

			handlePostGame(httptest.NewRecorder(), httptest.NewRequest("POST", "/", bytes.NewReader(config)))
		}()
	}
	wg.Wait()

	assert.Equal(t, gamesToCreate, len(State))
}
