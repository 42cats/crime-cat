const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');
const MessageBufferService = require('./services/MessageBufferService');
const VoiceStateManager = require('./services/VoiceStateManager');
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

// 서비스 초기화
const messageBuffer = new MessageBufferService();
const voiceStateManager = new VoiceStateManager();

// Socket.IO 서버 설정
const io = new Server(server, {
  cors: corsOptions,
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

console.log('🔧 Signal Server 초기화 중...');
console.log('📡 실시간 채팅 및 음성 알림 서버');
console.log('🚀 Cloudflare Realtime SFU + TURN 직접 연동');

// JWT 토큰 검증 미들웨어
const verifyToken = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 추출
    socket.user = {
      id: decoded.id || decoded.sub,
      username: decoded.username || decoded.preferred_username || decoded.name,
      email: decoded.email
    };
    
    socket.authToken = token;
    console.log(`✅ User authenticated: ${socket.user.username} (${socket.user.id})`);
    next();
    
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

// WebSocket 연결 처리
io.use(verifyToken);

io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.user.username} (${socket.id})`);

  // 채팅 이벤트 핸들러
  handleChatEvents(socket);
  
  // 음성 이벤트 핸들러 (알림만, SFU는 프론트엔드 직접 호출)
  handleVoiceEvents(socket);

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log(`💔 User disconnected: ${socket.user.username} (${socket.id})`);
    
    // VoiceStateManager에서 사용자 정리
    const leftChannel = voiceStateManager.handleSocketDisconnect(socket.id);
    
    if (leftChannel) {
      const { serverId, channelId } = leftChannel;
      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;

      // 채널의 다른 사용자들에게 퇴장 알림
      socket.to(voiceRoom).emit('voice:user-left', {
        userId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId
      });

      // 업데이트된 사용자 목록 브로드캐스트
      const remainingUsers = voiceStateManager.getChannelUsers(serverId, channelId);
      socket.to(voiceRoom).emit('voice:state:update', {
        serverId,
        channelId,
        users: remainingUsers
      });
    }
  });
});

// =============================================================================
// 채팅 이벤트 핸들러
// =============================================================================
const handleChatEvents = (socket) => {
  
  // 채널별 채팅 입장
  socket.on('channel:join', async (data) => {
    try {
      const { serverId, channelId } = data;

      // 채널 멤버십 확인 또는 자동 입장
      try {
        await axios.post(
          `${process.env.BACKEND_URL}/api/v1/signal/servers/${serverId}/channels/${channelId}/join`,
          {
            userId: socket.user.id,
            username: socket.user.username
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
              'X-User-ID': socket.user.id,
              'X-User-Token': socket.authToken,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (joinError) {
        // 이미 멤버인 경우 무시
        if (joinError.response?.status !== 409) {
          throw joinError;
        }
      }

      const channelRoom = `server:${serverId}:channel:${channelId}`;
      socket.join(channelRoom);
      socket.currentChannel = { serverId, channelId };

      console.log(`${socket.user.username} joined channel: ${serverId}/${channelId}`);

      // 채널 멤버들에게 알림
      socket.to(channelRoom).emit('channel:user-joined', {
        userId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId
      });

      socket.emit('channel:join:success', { serverId, channelId });

    } catch (error) {
      console.error('Channel join error:', error.message);
      socket.emit('error', {
        type: 'channel_join_error',
        message: 'Failed to join channel'
      });
    }
  });

  // 채널별 채팅 메시지 전송 (비동기 버퍼링 적용)
  socket.on('chat:message', async (data) => {
    try {
      const { serverId, channelId, content, messageType = 'text' } = data;

      // 채널 멤버십 확인
      if (!socket.currentChannel ||
        socket.currentChannel.serverId !== serverId ||
        socket.currentChannel.channelId !== channelId) {
        socket.emit('error', {
          type: 'channel_access_error',
          message: 'Not a member of this channel'
        });
        return;
      }

      // 메시지 객체 생성
      const message = {
        serverId,
        channelId,
        userId: socket.user.id,
        username: socket.user.username,
        content,
        messageType,
        timestamp: new Date().toISOString()
      };

      // Redis 버퍼에 메시지 추가 (서버-채널별 키 사용)
      const messageId = await messageBuffer.bufferMessage(message, serverId, channelId);

      // 클라이언트에게 즉시 전송 (실시간성 보장)
      const realtimeMessage = {
        ...message,
        id: messageId,
        buffered: true
      };

      // 해당 채널의 멤버들에게만 브로드캐스트
      const channelRoom = `server:${serverId}:channel:${channelId}`;
      io.to(channelRoom).emit('chat:message', realtimeMessage);

      console.log(`💬 Message in ${serverId}/${channelId}: ${socket.user.username} - ${content.substring(0, 50)}...`);

      // 메시지 전송 성공 응답
      socket.emit('chat:message:ack', {
        messageId,
        status: 'buffered',
        timestamp: message.timestamp,
        serverId,
        channelId
      });

    } catch (error) {
      console.error('Chat message error:', error.message);
      socket.emit('error', {
        type: 'message_send_error',
        message: 'Failed to send message'
      });
    }
  });

  // 타이핑 인디케이터
  socket.on('chat:typing', (data) => {
    const { serverId, channelId, isTyping } = data;
    
    if (socket.currentChannel?.serverId === serverId && 
        socket.currentChannel?.channelId === channelId) {
      const channelRoom = `server:${serverId}:channel:${channelId}`;
      socket.to(channelRoom).emit('chat:typing', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping,
        serverId,
        channelId
      });
    }
  });
};

// =============================================================================
// 음성 이벤트 핸들러 (메모리 기반 상태 관리)
// =============================================================================
const handleVoiceEvents = (socket) => {
  
  // 음성 채널 참가
  socket.on('voice:join', async (data) => {
    try {
      const { serverId, channelId, trackId } = data;

      // 채널 멤버십 확인 (백엔드 API 호출)
      try {
        await axios.post(
          `${process.env.BACKEND_URL}/api/v1/signal/servers/${serverId}/channels/${channelId}/join`,
          {
            userId: socket.user.id,
            username: socket.user.username
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
              'X-User-ID': socket.user.id,
              'X-User-Token': socket.authToken,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (joinError) {
        if (joinError.response?.status !== 409) {
          console.error('Voice channel join failed:', joinError.message);
          throw joinError;
        }
      }

      // VoiceStateManager에 사용자 추가 (trackId 포함)
      const channelUsers = voiceStateManager.joinVoiceChannel(
        socket.user.id,
        socket.user.username,
        serverId,
        channelId,
        socket.id,
        trackId  // SFU trackId 전달
      );

      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;
      socket.join(voiceRoom);
      socket.currentVoiceChannel = { serverId, channelId };

      // 새 참가자에게 기존 사용자 목록 전송
      socket.emit('voice:joined', {
        serverId,
        channelId,
        users: channelUsers.filter(u => u.userId !== socket.user.id) // 자신 제외
      });

      // 기존 사용자들에게 새 사용자 참가 알림 (trackId 포함)
      socket.to(voiceRoom).emit('voice:user-joined', {
        userId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId,
        trackId,  // SFU trackId 포함
        isMuted: false,
        isDeafened: false,
        isScreenSharing: false,
        isSpeaking: false
      });

      // 현재 사용자에게 성공 메시지 전송 (trackId가 포함된 사용자 목록)
      socket.emit('voice:join:success', { 
        serverId, 
        channelId,
        currentUsers: channelUsers
      });

      console.log(`✅ ${socket.user.username} 음성 채널 참가 완료: ${serverId}/${channelId}`);

    } catch (error) {
      console.error('Voice join error:', error.message);
      socket.emit('error', {
        type: 'voice_join_error',
        message: 'Failed to join voice channel'
      });
    }
  });

  // 음성 채널 퇴장
  socket.on('voice:leave', async (data) => {
    try {
      // VoiceStateManager에서 사용자 제거
      const leftChannel = voiceStateManager.leaveAllVoiceChannels(socket.user.id);
      
      if (leftChannel) {
        const { serverId, channelId } = leftChannel;
        const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;

        // 음성 세션 종료 로깅
        try {
          await axios.post(
            `${process.env.BACKEND_URL}/api/v1/signal/voice-sessions/end`,
            {
              userId: socket.user.id,
              serverId: serverId,
              channelId: channelId,
              endTime: new Date().toISOString()
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
                'X-User-ID': socket.user.id,
                'X-User-Token': socket.authToken,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (logError) {
          console.warn('Voice session end logging failed:', logError.message);
        }

        // 다른 사용자들에게 퇴장 알림
        socket.to(voiceRoom).emit('voice:user-left', {
          userId: socket.user.id,
          username: socket.user.username,
          serverId,
          channelId
        });

        // 업데이트된 사용자 목록 브로드캐스트
        const remainingUsers = voiceStateManager.getChannelUsers(serverId, channelId);
        socket.to(voiceRoom).emit('voice:state:update', {
          serverId,
          channelId,
          users: remainingUsers
        });

        socket.leave(voiceRoom);
        socket.currentVoiceChannel = null;
        console.log(`🚪 ${socket.user.username} left voice channel: ${serverId}/${channelId}`);
      }
    } catch (error) {
      console.error('Voice leave error:', error.message);
    }
  });

  // 음성 볼륨 업데이트 (채널 기반)
  socket.on('voice:volume', (data) => {
    const { volume, serverId, channelId } = data;
    
    if (socket.currentVoiceChannel?.serverId === serverId && 
        socket.currentVoiceChannel?.channelId === channelId) {
      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;
      socket.to(voiceRoom).emit('voice:volume', {
        userId: socket.user.id,
        username: socket.user.username,
        volume,
        serverId,
        channelId
      });
    }
  });

  // 음성 상태 업데이트 (음소거, 헤드셋 등)
  socket.on('voice:status', (data) => {
    const { serverId, channelId, isMuted, isDeafened, isScreenSharing } = data;
    
    // VoiceStateManager에서 상태 업데이트
    const updatedState = voiceStateManager.updateVoiceStatus(socket.user.id, {
      isMuted,
      isDeafened,
      isScreenSharing
    });
    
    if (updatedState && socket.currentVoiceChannel?.serverId === serverId && 
        socket.currentVoiceChannel?.channelId === channelId) {
      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;
      
      // 다른 사용자들에게 상태 변경 알림
      socket.to(voiceRoom).emit('voice:status', {
        userId: socket.user.id,
        username: socket.user.username,
        isMuted,
        isDeafened,
        isScreenSharing,
        serverId,
        channelId
      });

      // 전체 사용자 목록 업데이트 브로드캐스트
      const channelUsers = voiceStateManager.getChannelUsers(serverId, channelId);
      io.to(voiceRoom).emit('voice:state:update', {
        serverId,
        channelId,
        users: channelUsers
      });
    }
  });

  // Speaking Detection 이벤트 (Phase 1에서 구현한 클라이언트 기반)
  socket.on('voice:speaking', (data) => {
    const { serverId, channelId, isSpeaking } = data;
    
    // VoiceStateManager에서 speaking 상태 업데이트
    const speakingUpdate = voiceStateManager.updateSpeakingStatus(socket.user.id, isSpeaking);
    
    if (speakingUpdate && socket.currentVoiceChannel?.serverId === serverId && 
        socket.currentVoiceChannel?.channelId === channelId) {
      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;
      
      // 다른 사용자들에게 speaking 상태 브로드캐스트
      socket.to(voiceRoom).emit('voice:speaking', {
        userId: socket.user.id,
        username: socket.user.username,
        isSpeaking,
        serverId,
        channelId
      });
    }
  });

  // 음성 채널 사용자 목록 조회
  socket.on('voice:get-users', (data) => {
    const { serverId, channelId } = data;
    
    const channelUsers = voiceStateManager.getChannelUsers(serverId, channelId);
    
    socket.emit('voice:users', {
      serverId,
      channelId,
      users: channelUsers
    });
  });
};

// =============================================================================
// 기본 HTTP 엔드포인트
// =============================================================================

// 헬스체크
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'signal-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 상태 확인
app.get('/status', async (req, res) => {
  try {
    const bufferStatus = await messageBuffer.getBufferStatus();
    const voiceStats = voiceStateManager.getStats();
    
    res.json({
      status: 'ok',
      service: 'signal-server',
      mode: 'discord-style-voice',
      webrtc: 'cloudflare-realtime-sfu',
      buffer: bufferStatus,
      voice: voiceStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// =============================================================================
// 음성 상태 관리 API
// =============================================================================

// 음성 채널 상태 조회
app.get('/voice/channel/:serverId/:channelId', (req, res) => {
  try {
    const { serverId, channelId } = req.params;
    const channelUsers = voiceStateManager.getChannelUsers(serverId, channelId);
    
    res.json({
      status: 'ok',
      serverId,
      channelId,
      users: channelUsers,
      userCount: channelUsers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get channel voice state',
      error: error.message
    });
  }
});

// 사용자 음성 상태 조회
app.get('/voice/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userState = voiceStateManager.getUserVoiceState(userId);
    
    if (!userState) {
      return res.status(404).json({
        status: 'not_found',
        message: 'User not in any voice channel'
      });
    }
    
    res.json({
      status: 'ok',
      user: userState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user voice state',
      error: error.message
    });
  }
});

// 전체 음성 상태 통계
app.get('/voice/stats', (req, res) => {
  try {
    const stats = voiceStateManager.getStats();
    
    res.json({
      status: 'ok',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get voice stats',
      error: error.message
    });
  }
});

// =============================================================================
// 관리자 API (메시지 버퍼링 관리)
// =============================================================================

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

// =============================================================================
// 🗑️ WebRTC/SFU API 엔드포인트 제거됨
// =============================================================================
// 
// 모든 WebRTC 및 SFU 관련 API는 제거되었습니다.
// 프론트엔드에서 Cloudflare Realtime API를 직접 호출합니다:
// 
// - TURN 자격증명: https://rtc.live.cloudflare.com/v1/turn/keys/{TURN_KEY_ID}/credentials/generate
// - SFU 세션: https://rtc.live.cloudflare.com/v1/apps/{APP_ID}/sessions/new
// - 트랙 관리: https://rtc.live.cloudflare.com/v1/apps/{APP_ID}/sessions/{sessionId}/tracks/new
// 
// Signal Server는 이제 순수 채팅 + 알림 서버로만 동작합니다.

// =============================================================================
// 주기적인 정리 작업
// =============================================================================

// VoiceStateManager 정리 작업 (30분마다)
setInterval(() => {
  const cleanedCount = voiceStateManager.cleanup();
  if (cleanedCount > 0) {
    console.log(`🧹 Voice state cleanup: ${cleanedCount} inactive users removed`);
  }
}, 30 * 60 * 1000); // 30분

// =============================================================================
// 서버 시작
// =============================================================================

const PORT = process.env.SIGNAL_PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Signal server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`⚡ Backend URL: ${process.env.BACKEND_URL}`);
  console.log(`💬 Mode: Discord-style Voice Chat`);
  console.log(`🎤 Voice State: Memory-based Management`);
  console.log(`🗣️ Speaking Detection: Client-side`);
  console.log(`🎬 WebRTC/SFU: Cloudflare Realtime Direct`);
  console.log('');
  console.log('✅ Phase 2 완료: 메모리 기반 음성 상태 관리 시스템');
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