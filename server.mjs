import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';

const port = parseInt(process.env.PORT || "10000", 10);
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: dev ? "*" : "https://pixipush-d9nc.onrender.com/", // safer in prod
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`🟢 New client connected: ${socket.id}`);

    socket.on("chat", (data) => {
      console.log("💬 Chat received:", data);
      io.emit("chat", data);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });
  });

  server.listen(port, () => {
    console.log(`🚀 Server with socket running on http://localhost:${port}`);
  });
});
