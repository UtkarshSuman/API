import { io } from "socket.io-client";

const socket = io("https://jokesapi-24iv.onrender.com", {
  transports: ["websocket", "polling"]
});

export default socket;