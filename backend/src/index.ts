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
const io = new SocketIOServer(server, {
  cors: {
    origin: 'cyberskillscmq.vercel.app', // Replace with your frontend URL (e.g., http://localhost:3000 for development)
    methods: ['GET', 'POST', 'DELETE'],
  },
});

app.use(cors());
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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});