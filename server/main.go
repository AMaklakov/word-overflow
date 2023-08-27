package main

import (
	"AMaklakov/word-overflow/common"
	"AMaklakov/word-overflow/word_overflow"
	"net/http"

	"github.com/go-chi/chi/v5"
)

const PORT = "0.0.0.0:5000"

func main() {
	r := chi.NewRouter()

	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
		common.WriteJSON(w, 200, &struct {
			Message string `json:"message"`
		}{"Pong"})
	})

	word_overflow.NewServer().Group(r, "words-overflow")

	http.ListenAndServe(PORT, r)
}
