import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import matchRoutes from './routes/match';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { setupSocket } from './routes/match';

dotenv.config();

const app: Application = express();
const server = createServer(app);

// Configure CORS for socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: 'https://cyberskillscmq.vercel.app', // Exact frontend origin
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
});

// Configure CORS for Express
app.use(cors({
  origin: 'https://cyberskillscmq.vercel.app', // Exact frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Debug middleware to log CORS headers
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`Response Headers for ${req.url}:`, res.getHeaders());
  });
  next();
});

app.use(express.json());

// Attach Socket.IO instance to the app for use in routes
app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

app.use('/auth', authRoutes);
app.use('/match', matchRoutes);

// Initialize Socket.IO event handlers
setupSocket(io);

// Debug logging for WebSocket connections
io.on('connection', (socket) => {
  console.log(`WebSocket connection established: ${socket.id}, Origin: ${socket.handshake.headers.origin}`);
  socket.on('disconnect', () => {
    console.log(`WebSocket connection closed: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on https://cyberskills.onrender.com:${PORT}`);
  console.log(`WebSocket server ready at wss://cyberskills.onrender.com`);
});