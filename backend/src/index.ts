import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import matchRoutes from './routes/match';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { setupSocketIO } from './routes/match';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app: Application = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://cyberskillscmq.vercel.app',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://cyberskillscmq.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}, Body:`, req.body);
  res.on('finish', () => {
    console.log(`Response: ${req.method} ${req.url}, Status: ${res.statusCode}`);
  });
  next();
});

app.use(express.json());

// Attach Socket.IO instance to app
app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/match', matchRoutes);

// Initialize Socket.IO handlers
setupSocketIO(io);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on https://localhost:${PORT}`);
  console.log(`WebSocket server ready at wss://localhost:${PORT}`);
});