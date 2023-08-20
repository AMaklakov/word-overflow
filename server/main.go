package main

import (
	"AMaklakov/word-overflow/word_overflow"
	"net/http"

	"github.com/go-chi/chi/v5"
)

const PORT = ":5123"

func main() {
	r := chi.NewRouter()
	word_overflow.NewRouter(r, "words-overflow")
	http.ListenAndServe(PORT, r)
}
