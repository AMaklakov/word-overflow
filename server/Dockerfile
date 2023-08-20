# # build stage
# FROM golang:alpine AS builder

# WORKDIR /go/src/AMaklakov/word-overflow

# COPY . .
# RUN go mod download
# RUN go build -o word-overflow
# ENTRYPOINT /go/src/AMaklakov/word-overflow/word-overflow

# FROM alpine:latest
# RUN apk --no-cache add ca-certificates
# COPY --from=builder /go/src/AMaklakov/word-overflow/word-overflow /word-overflow
# ENTRYPOINT ./word-overflow
# ENV HTTP_PORT=5000
# EXPOSE 5000

FROM golang:latest 
RUN mkdir /app 
ADD . /app/ 
WORKDIR /app
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY . .
RUN go install
ENTRYPOINT ["/go/bin/word-overflow"]