package common

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestWriteError(t *testing.T) {
	rr := httptest.NewRecorder()
	err := WriteError(rr, 400, "message")

	assert.NoError(t, err)
	assert.Equal(t, rr.Header().Get("Content-Type"), "application/json")
	assert.Equal(t, rr.Result().StatusCode, 400)

	message, err := json.Marshal(ApiError{"message"})
	assert.NoError(t, err)
	assert.JSONEq(t, rr.Body.String(), string(message))
}

func TestWriteJSON(t *testing.T) {
	rr := httptest.NewRecorder()
	err := WriteJSON(rr, 400, ApiError{"message"})

	assert.NoError(t, err)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
	assert.Equal(t, 400, rr.Result().StatusCode)

	message, err := json.Marshal(ApiError{"message"})
	assert.NoError(t, err)
	assert.JSONEq(t, rr.Body.String(), string(message))
}

// func TestWriteJSONError(t *testing.T) {
// 	rr := httptest.NewRecorder()
// 	err := WriteJSON(rr, 400, "not a json")
// 	assert.Error(t, err)
// 	assert.Equal(t, 500, rr.Result().StatusCode, "should be internal server error")
// }
