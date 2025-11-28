const app = require('./app');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import Socket.IO handlers
const initChatHandlers = require('./socket/chatHandlers');
const initAdminHandlers = require('./socket/adminHandlers');

const PORT = process.env.PORT || 5000;
app.set('trust proxy', true);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

// Make io available globally for controllers
global._io = io;

// Socket.IO Authentication Middleware
io.use((socket, next) => {
    let token = socket.handshake.auth?.token;

    // Fallback: get token from Authorization header
    if (!token && socket.handshake.headers.authorization) {
        const hdr = socket.handshake.headers.authorization;
        token = hdr.startsWith('Bearer ') ? hdr.slice(7) : hdr;
    }

    if (!token) {
        return next(new Error('Missing authentication token'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.id;
        socket.userRole = decoded.role || 'user'; // Assuming role is in JWT
        next();
    } catch (error) {
        return next(new Error('Invalid authentication token'));
    }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    // Initialize chat handlers for all users
    initChatHandlers(io, socket);

    // Initialize admin handlers if user is admin
    if (socket.userRole === 'admin') {
        initAdminHandlers(io, socket);
        console.log(`👨‍💼 Admin handlers initialized for user ${socket.userId}`);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
        socket.leave(`user_${socket.userId}`);
        console.log(`❌ Socket disconnected: ${socket.id} (User: ${socket.userId})`);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready for realtime chat`);
    console.log(`🤖 AI Provider: ${process.env.GROQ_API_KEY ? 'Groq' : ''}${process.env.GEMINI_API_KEY ? ' + Gemini' : ''}`);
});