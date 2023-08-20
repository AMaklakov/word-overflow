package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
)

type ApiError struct {
	Message string `json:"message"`
}

func WriteError(w http.ResponseWriter, code int, message string) error {
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

func getId(length int) string {
	characters := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	id := make([]byte, 0, length)
	for i := 0; i < length; i++ {
		id = append(id, characters[rand.Intn(len(characters))])
	}
	return string(id)
}
