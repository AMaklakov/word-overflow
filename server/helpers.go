package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
)

type ErrorBody struct {
	Message string `json:"message"`
}

func sendError(w http.ResponseWriter, code int, message string) {
	sendJSON(w, code, &ErrorBody{message})
}

func sendJSON(w http.ResponseWriter, code int, message any) {
	body, err := json.Marshal(message)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println("Failed to send the message: ", message, " with code: ", code)
		return
	}
	w.WriteHeader(code)
	w.Write(body)
}

func getId(length int) string {
	characters := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	id := make([]byte, 0, length)
	for i := 0; i < length; i++ {
		id = append(id, characters[rand.Intn(len(characters))])
	}
	return string(id)
}
