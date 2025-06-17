const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Signal Server' });
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
    
    socket.on('chat:message', (data) => {
        console.log('Message received:', data);
        io.emit('chat:message', data);
    });
});

const PORT = process.env.SIGNAL_PORT || 4000;
server.listen(PORT, () => {
    console.log(`Signal Server running on port ${PORT}`);
});