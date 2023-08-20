package common

import (
	"encoding/json"
	"log"
	"net/http"
)

type ApiError struct {
	Message string `json:"message"`
}

func WriteError(w http.ResponseWriter, code int, message string) error {
	log.Println("Api error", code, message)
	return WriteJSON(w, code, &ApiError{message})
}

func WriteJSON(w http.ResponseWriter, code int, message any) error {
	w.WriteHeader(code)
	w.Header().Add("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(message)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println("Failed to send the message: ", message, " with code: ", code)
	}

	return err
}
