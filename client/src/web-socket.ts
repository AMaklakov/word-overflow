import { Observable } from 'rxjs'
import { filter } from 'rxjs/operators'
import CONFIG from './config'
import { WebSocketSubject, webSocket } from 'rxjs/webSocket'

export default class Socket<T> {
  private socket: WebSocketSubject<T>

  constructor(url: string) {
    this.socket = webSocket<T>(url)
  }

  // send = (message) => {
  //   this.socket.next(message)
  // }

  filter = (...args: Parameters<typeof filter<T>>): Observable<T> => this.socket.pipe(filter(...args))

  subscribe = (next) => {
    this.socket.subscribe({
      next: (msg) => {
        next(msg)
        return console.log('message received: ', msg)
      }, // Called whenever there is a message from the server.
      error: (err) => console.log(err), // Called if at any point WebSocket API signals some kind of error.
      complete: () => console.log('complete'), // Called when connection is closed (for whatever reason).
    })
  }

  // unsubscribe = () => {
  //   this.socket.complete()
  // }
}
