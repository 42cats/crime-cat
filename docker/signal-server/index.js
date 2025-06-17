const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');
const MessageBufferService = require('./services/MessageBufferService');
require('dotenv').config();

const app = express();
const server = createServer(app);

// CORS 설정
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// 메시지 버퍼 서비스 초기화
const messageBuffer = new MessageBufferService();

// Socket.IO 서버 설정
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// JWT 인증 미들웨어
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.cookie?.split(';')
                   .find(c => c.trim().startsWith('accessToken='))
                   ?.split('=')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // JWT 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 백엔드 API로 사용자 정보 검증
    try {
      const response = await axios.get(`${process.env.BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          'Cookie': `accessToken=${token}`,
          'Authorization': `Bearer ${token}`
        }
      });
      
      socket.user = {
        id: decoded.sub || decoded.userId,
        username: response.data.username || response.data.name,
        ...response.data
      };
      
      next();
    } catch (error) {
      console.error('User verification failed:', error.message);
      return next(new Error('Authentication error: Invalid user'));
    }
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return next(new Error('Authentication error: Invalid token'));
  }
};

// 채팅 관련 이벤트 핸들러
const handleChatEvents = (socket) => {
  // 채팅 메시지 전송 (비동기 버퍼링 적용)
  socket.on('chat:message', async (data) => {
    try {
      const message = {
        userId: socket.user.id,
        username: socket.user.username,
        content: data.content,
        messageType: data.messageType || 'text',
        timestamp: new Date()
      };

      // Redis 버퍼에 메시지 추가 (즉시 응답)
      const messageId = await messageBuffer.bufferMessage(message);
      
      // 클라이언트에게 즉시 전송 (실시간성 보장)
      const realtimeMessage = {
        ...message,
        id: messageId,
        buffered: true // 버퍼링된 메시지임을 표시
      };
      
      // 모든 클라이언트에게 브로드캐스트
      io.emit('chat:message', realtimeMessage);
      
      console.log(`💬 Chat message buffered: ${socket.user.username} - ${data.content.substring(0, 50)}...`);
      
      // 메시지 전송 성공 응답
      socket.emit('chat:message:ack', { 
        messageId: messageId,
        status: 'buffered',
        timestamp: message.timestamp 
      });
      
    } catch (error) {
      console.error('❌ Error handling chat message:', error.message);
      socket.emit('error', { 
        type: 'chat_error',
        message: 'Failed to send message',
        details: error.message 
      });
    }
  });

  // 타이핑 상태 전송
  socket.on('chat:typing', (data) => {
    socket.broadcast.emit('chat:typing', {
      userId: socket.user.id,
      username: socket.user.username,
      isTyping: data.isTyping
    });
  });
};

// 음성 채팅 관련 이벤트 핸들러
const handleVoiceEvents = (socket) => {
  // WebRTC 시그널링
  socket.on('voice:offer', (data) => {
    socket.to(data.targetUserId).emit('voice:offer', {
      from: socket.user.id,
      offer: data.offer
    });
  });

  socket.on('voice:answer', (data) => {
    socket.to(data.targetUserId).emit('voice:answer', {
      from: socket.user.id,
      answer: data.answer
    });
  });

  socket.on('voice:ice-candidate', (data) => {
    socket.to(data.targetUserId).emit('voice:ice-candidate', {
      from: socket.user.id,
      candidate: data.candidate
    });
  });

  // 음성 채팅 참여/퇴장
  socket.on('voice:join', () => {
    socket.join('voice-room');
    socket.to('voice-room').emit('voice:user-joined', {
      userId: socket.user.id,
      username: socket.user.username
    });
    
    console.log(`${socket.user.username} joined voice chat`);
  });

  socket.on('voice:leave', () => {
    socket.leave('voice-room');
    socket.to('voice-room').emit('voice:user-left', {
      userId: socket.user.id,
      username: socket.user.username
    });
    
    console.log(`${socket.user.username} left voice chat`);
  });

  // 음성 볼륨 업데이트
  socket.on('voice:volume', (data) => {
    socket.to('voice-room').emit('voice:volume', {
      userId: socket.user.id,
      volume: data.volume
    });
  });
};

// 관리자 기능 이벤트 핸들러
const handleAdminEvents = (socket) => {
  // 투표 생성
  socket.on('admin:vote:create', async (data) => {
    try {
      // 관리자 권한 확인 (간단한 예시)
      if (!socket.user.isAdmin) {
        socket.emit('error', { message: 'Admin permission required' });
        return;
      }

      const vote = await axios.post(`${process.env.BACKEND_URL}/api/v1/votes`, data, {
        headers: {
          'Authorization': `Bearer ${socket.handshake.auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      // 모든 클라이언트에게 새 투표 브로드캐스트
      io.emit('vote:created', vote.data);
      
      console.log(`Vote created by ${socket.user.username}: ${data.question}`);
    } catch (error) {
      console.error('Error creating vote:', error.message);
      socket.emit('error', { message: 'Failed to create vote' });
    }
  });

  // 공지사항 생성
  socket.on('admin:announcement:create', async (data) => {
    try {
      if (!socket.user.isAdmin) {
        socket.emit('error', { message: 'Admin permission required' });
        return;
      }

      const announcement = await axios.post(`${process.env.BACKEND_URL}/api/v1/announcements`, data, {
        headers: {
          'Authorization': `Bearer ${socket.handshake.auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      // 모든 클라이언트에게 공지사항 브로드캐스트
      io.emit('announcement:created', announcement.data);
      
      console.log(`Announcement created by ${socket.user.username}: ${data.message}`);
    } catch (error) {
      console.error('Error creating announcement:', error.message);
      socket.emit('error', { message: 'Failed to create announcement' });
    }
  });
};

// Socket.IO 연결 처리
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.user.id})`);

  // 이벤트 핸들러 등록
  handleChatEvents(socket);
  handleVoiceEvents(socket);
  handleAdminEvents(socket);

  // 사용자 연결 알림
  socket.broadcast.emit('user:connected', {
    userId: socket.user.id,
    username: socket.user.username
  });

  // 연결 해제 처리
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.user.username} (${reason})`);
    
    // 음성 채팅에서 자동 퇴장
    socket.to('voice-room').emit('voice:user-left', {
      userId: socket.user.id,
      username: socket.user.username
    });

    // 사용자 연결 해제 알림
    socket.broadcast.emit('user:disconnected', {
      userId: socket.user.id,
      username: socket.user.username
    });
  });

  // 에러 처리
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.user.username}:`, error);
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount 
  });
});

// 서버 상태 API
app.get('/status', async (req, res) => {
  const bufferStatus = await messageBuffer.getBufferStatus();
  
  res.json({
    server: 'Mystery Place Signal Server',
    version: '1.0.0',
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
    memory: process.memoryUsage(),
    messageBuffer: bufferStatus
  });
});

// 버퍼 상태 조회 API (관리자용)
app.get('/admin/buffer', async (req, res) => {
  try {
    const bufferStatus = await messageBuffer.getBufferStatus();
    res.json({
      status: 'ok',
      buffer: bufferStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get buffer status',
      error: error.message
    });
  }
});

// 수동 배치 처리 트리거 API (관리자용)
app.post('/admin/buffer/flush', async (req, res) => {
  try {
    await messageBuffer.processBatch();
    const bufferStatus = await messageBuffer.getBufferStatus();
    
    res.json({
      status: 'ok',
      message: 'Batch processing triggered',
      buffer: bufferStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to flush buffer',
      error: error.message
    });
  }
});

// 실패한 메시지 재시도 API (관리자용)
app.post('/admin/buffer/retry-failed', async (req, res) => {
  try {
    await messageBuffer.retryFailedMessages();
    
    res.json({
      status: 'ok',
      message: 'Failed messages retry initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retry failed messages',
      error: error.message
    });
  }
});

const PORT = process.env.SIGNAL_PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Signal server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`⚡ Backend URL: ${process.env.BACKEND_URL}`);
});

// 프로세스 종료 시 정리 작업
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Signal server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Signal server closed');
    process.exit(0);
  });
});