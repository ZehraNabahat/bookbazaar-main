import dotenv from 'dotenv';

dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { ensureAdminUser, ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD } from './utils/ensureAdminUser.js';

const corsOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
]
  .flatMap((o) => (o ? o.split(',').map((s) => s.trim()) : []))
  .filter(Boolean);

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Apply raw body parser ONLY for Stripe Webhook, and json parser for everything else
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cookieParser());

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io setup for chat and order tracking
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join order room for tracking updates
  socket.on('join_order_room', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order room ${orderId}`);
  });

  // Direct messaging
  socket.on('join_chat', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their chat room`);
  });

  socket.on('send_message', async (data) => {
    const { sender, receiver, content } = data;
    try {
      const DirectMessage = (await import('./models/DirectMessage.js')).default;
      const message = await DirectMessage.create({ sender, receiver, content });
      io.to(`user_${receiver}`).emit('receive_message', message);
      io.to(`user_${sender}`).emit('receive_message', message); // send back to sender for confirmation
    } catch (err) {
      console.error('Message save error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Pass io to routes if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminReviewRoutes from './routes/adminReviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', stripeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes);
app.use('/api/reviews', adminReviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('E-Commerce API is running');
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/dev/seed-admin', async (req, res) => {
    try {
      const { message } = await ensureAdminUser({ resetPassword: true });
      res.json({
        message,
        email: ADMIN_EMAIL,
        password: ADMIN_DEFAULT_PASSWORD,
        loginUrl: 'http://localhost:3000/login',
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});