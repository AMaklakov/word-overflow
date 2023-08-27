install:
	go mod tidy
	go install

dev: install
	go run .

build: install
	go build -o .bin/words-overflow

start: build
	./.bin/words-overflow

test: install
	go clean -testcache
	go test -race -cover ./... 

bench:
	rm -rf old.txt
	rm -rf new.txt
	@git stash push $(git diff --name-only HEAD | grep -v test)
	go test -run=NONE -bench=. ./... -count=6 > old.txt
	@git stash pop
	go test -run=NONE -bench=. ./... -count=6 > new.txt
	benchstat old.txt new.txt