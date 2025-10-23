const app = require('./app');
const http = require('http');
const server = http.createServer(app);      // tạo HTTP server
const { Server } = require('socket.io');    // Socket.IO v4
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const cleanupPendingTx = require('./cron/cleanupPendingTx');
const dailyPayout = require('./cron/dailyPayout');

const PORT = process.env.PORT || 5000;
app.set('trust proxy', true);

// 1. Khởi tạo io
const io = new Server(server, {
    cors: {
        origin: process.env.REACT_APP_API_URL || 'http://localhost:3000',
        credentials: true
    }
});

// 2. Cho controller có thể gọi io
global._io = io;

io.use((socket, next) => {
    // 1. lấy từ handshake.auth trước
    let token = socket.handshake.auth?.token;

    // 2. fallback: lấy từ header Authorization nếu client gửi header
    if (!token && socket.handshake.headers.authorization) {
        const hdr = socket.handshake.headers.authorization;
        token = hdr.startsWith('Bearer ') ? hdr.slice(7) : hdr;
    }

    if (!token) return next(new Error('Missing token'));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.id; // ← dùng key bạn đã có
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});
// 4. Xử lý kết nối
io.on('connection', socket => {
    console.log(`Socket ${socket.id} connected, user ${socket.userId}`);
    socket.join(`user_${socket.userId}`); // vào phòng riêng

    socket.on('disconnect', () => {
        socket.leave(`user_${socket.userId}`);
        console.log(`Socket ${socket.id} disconnected`);
    });
});
cron.schedule('*/10 * * * *', cleanupPendingTx);
cron.schedule('0 9 * * *', dailyPayout); // 9h sáng mỗi ngày
// 5. Khởi động server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));