package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type ErrorBody struct {
	Message string `json:"message"`
}

func sendError(w http.ResponseWriter, code int, message string) {
	body, err := json.Marshal(&ErrorBody{message})
	if err != nil {
		log.Println("Failed to send the message: ", message, " with code: ", code)
		return
	}
	w.WriteHeader(code)
	w.Write(body)
}
