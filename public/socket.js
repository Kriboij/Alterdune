import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

export function createSocket() {
  return io({
    autoConnect: false,
    reconnection: false
  });
}
