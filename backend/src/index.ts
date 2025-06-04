import express, { Application, Request, Response } from 'express';
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
    origin: [
      'https://cyberskillscmq.vercel.app',
      'http://localhost:3000', // Pour le développement local
      'http://localhost:5173'  // Pour Vite en développement
    ],
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['websocket', 'polling'], // Support des deux transports
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Configure CORS for Express
app.use(cors({
  origin: [
    'https://cyberskillscmq.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Trust proxy (important pour les déploiements sur Render/Vercel)
app.set('trust proxy', 1);

// Debug middleware to log requests and responses
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Request: ${req.method} ${req.url}`);

  // Log body seulement pour POST/PUT/PATCH et pas pour les mots de passe
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const bodyToLog = { ...req.body };
    if (bodyToLog.password) bodyToLog.password = '[REDACTED]';
    if (bodyToLog.passwordHash) bodyToLog.passwordHash = '[REDACTED]';
    console.log(`[${timestamp}] Body:`, bodyToLog);
  }

  res.on('finish', () => {
    console.log(`[${timestamp}] Response: ${req.method} ${req.url}, Status: ${res.statusCode}`);
  });
  next();
});

// Middleware pour parser JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach Socket.IO instance to the app AVANT les routes
app.set('io', io);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/match', matchRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Initialize Socket.IO event handlers
setupSocket(io);

// Enhanced WebSocket connection logging
io.on('connection', (socket) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔌 WebSocket connected:`, {
    socketId: socket.id,
    origin: socket.handshake.headers.origin,
    userAgent: socket.handshake.headers['user-agent'],
    transport: socket.conn.transport.name,
    totalConnections: io.engine.clientsCount
  });

  // Log transport upgrades
  socket.conn.on('upgrade', () => {
    console.log(`[${timestamp}] ⬆️  Transport upgraded to WebSocket for ${socket.id}`);
  });

  socket.on('disconnect', (reason) => {
    const disconnectTime = new Date().toISOString();
    console.log(`[${disconnectTime}] 🔌 WebSocket disconnected:`, {
      socketId: socket.id,
      reason,
      remainingConnections: io.engine.clientsCount - 1
    });
  });

  // Log authentication attempts
  socket.on('authenticate', () => {
    console.log(`[${timestamp}] 🔐 Authentication attempt from ${socket.id}`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`[${timestamp}] ❌ Socket error for ${socket.id}:`, error);
  });
});

// Handle Socket.IO server errors
io.on('error', (error) => {
  console.error('Socket.IO server error:', error);
});

const PORT = process.env.PORT || 4000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ✅ Server running on port ${PORT}`);
  console.log(`[${timestamp}] 🌐 HTTP server: ${process.env.NODE_ENV === 'production' ? 'https://cyberskills.onrender.com' : `http://localhost:${PORT}`}`);
  console.log(`[${timestamp}] 🔌 WebSocket server ready`);
  console.log(`[${timestamp}] 🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});