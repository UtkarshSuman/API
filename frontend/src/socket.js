import { io } from "socket.io-client";

const socket = io("https://jokesapi-24iv.onrender.com", {
  autoConnect: false,
  transports: ["websocket"]
});

export default socket;