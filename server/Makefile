install:
	go mod tidy
	go install

dev: install
	go run .

build: install
	go build -o .bin/words-overflow

start: build
	./.bin/words-overflow