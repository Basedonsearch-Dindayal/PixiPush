import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

// Don't set hostname in Render — it will auto-bind correctly
const app = next({ dev });
const handle = app.getRequestHandler();

const userRooms = new Map(); // socket.id -> { userName, room }

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? '*' : 'https://pixipush-d9nc.onrender.com',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🟢 New client connected: ${socket.id}`);

    socket.on('join-room', ({ room, userName }) => {
      socket.join(room);
      userRooms.set(socket.id, { userName, room });
      socket.to(room).emit('user_joined', `${userName} has joined the room.`);
    });

    socket.on('message', ({ room, message, sender, time }) => {
      socket.to(room).emit('message', { sender, message, time });
    });

    socket.on('leave-room', () => {
      const userData = userRooms.get(socket.id);
      if (userData) {
        const { userName, room } = userData;
        socket.to(room).emit('user_left', `${userName} has left the room.`);
        socket.leave(room);
        userRooms.delete(socket.id);
      }
    });

    socket.on('disconnect', () => {
      const userData = userRooms.get(socket.id);
      if (userData) {
        const { userName, room } = userData;
        socket.to(room).emit('user_left', `${userName} has disconnected.`);
        userRooms.delete(socket.id);
      }
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });
});
