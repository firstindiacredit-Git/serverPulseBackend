const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');
const serverRoutes = require('./routes/serverRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const { performHealthChecks } = require('./services/healthCheck');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Middleware
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Routes
app.use('/api/servers', serverRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/credentials', credentialRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health-monitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Schedule health checks every 2 hours
cron.schedule('0 */2 * * *', async () => {
  console.log('Running scheduled health checks');
  try {
    const results = await performHealthChecks();
    io.emit('healthCheckResults', results);
  } catch (error) {
    console.error('Health check error:', error);
  }
});

// Update environment variables
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set in environment variables. Using a default secret (not recommended for production)');
  process.env.JWT_SECRET = 'your-default-secret-key-change-in-production';
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
