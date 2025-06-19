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
        .find(c => c.trim().startsWith('Authorization='))
        ?.split('=')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // JWT 검증 (Spring Boot와 동일한 환경변수 및 알고리즘 사용)
    const jwtSecret = process.env.SPRING_SECRET_KEY || process.env.JWT_SECRET;
    console.log('🔑 JWT Secret available:', !!jwtSecret);
    console.log('🔑 Using SPRING_SECRET_KEY:', !!process.env.SPRING_SECRET_KEY);
    console.log('🔑 Using JWT_SECRET:', !!process.env.JWT_SECRET);

    // DEBUG: Secret 값 비교 (첫 10자리와 마지막 10자리만 로깅)
    console.log('🔍 Secret preview:', jwtSecret ?
      `${jwtSecret.substring(0, 10)}...${jwtSecret.substring(jwtSecret.length - 10)}` : 'null');
    console.log('🔍 Secret length:', jwtSecret ? jwtSecret.length : 0);

    if (!jwtSecret) {
      return next(new Error('Authentication error: JWT secret not configured'));
    }

    // 토큰 헤더 분석 (서명 검증 없이)
    const decodedHeader = jwt.decode(token, { complete: true });
    console.log('📋 Token header:', decodedHeader?.header);
    console.log('🔐 Token algorithm:', decodedHeader?.header?.alg);
    console.log('🔍 Token preview:', token ?
      `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : 'null');

    // Spring Boot와 동일한 방식으로 JWT 검증 (Base64 디코딩 우선)
    let decoded = null;

    try {
      // 방법 1: Base64 디코딩으로 검증 (Spring Boot와 동일)
      console.log('🔍 시도 1: Base64 디코딩으로 검증 (Spring Boot 방식)');
      const base64Secret = Buffer.from(jwtSecret, 'base64');
      decoded = jwt.verify(token, base64Secret, { algorithms: ['HS256'] });
      console.log('✅ Base64 디코딩 검증 성공 - Spring Boot와 일치');
    } catch (error1) {
      console.log('❌ Base64 디코딩 검증 실패:', error1.message);

      try {
        // 방법 2: 기본 문자열로 검증 (백업)
        console.log('🔍 시도 2: 기본 문자열로 검증');
        decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
        console.log('✅ 기본 문자열 검증 성공');
      } catch (error2) {
        console.log('❌ 기본 문자열 검증 실패:', error2.message);

        try {
          // 방법 3: Buffer로 변환하여 검증
          console.log('🔍 시도 3: Buffer 변환으로 검증');
          const bufferSecret = Buffer.from(jwtSecret, 'utf8');
          decoded = jwt.verify(token, bufferSecret, { algorithms: ['HS256'] });
          console.log('✅ Buffer 변환 검증 성공');
        } catch (error3) {
          console.log('❌ Buffer 변환 검증 실패:', error3.message);
          throw new Error('Authentication error: All JWT verification methods failed');
        }
      }
    }

    if (!decoded) {
      throw new Error('Authentication error: JWT verification failed - no decoded token');
    }

    console.log('✅ JWT 검증 성공, decoded token:', {
      sub: decoded.sub,
      nickname: decoded.nickname,
      iat: decoded.iat,
      exp: decoded.exp
    });

    // 백엔드 API로 사용자 정보 검증

    try {
      const response = await axios.get(`${process.env.BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          'Cookie': `Authorization=${token}`
        }
      });

      socket.user = {
        id: decoded.sub || decoded.userId,
        username: response.data.nickname || response.data.username || response.data.name,
        nickname: response.data.nickname,
        snowflake: response.data.snowflake,
        ...response.data
      };

      // 토큰을 socket에 저장하여 이후 API 호출에서 사용
      socket.authToken = token;

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

// 서버-채널 구조 기반 채팅 관련 이벤트 핸들러
const handleChatEvents = (socket) => {

  // 서버 입장
  socket.on('server:join', async (data) => {
    try {
      const { serverId } = data;

      // 서버 멤버십 확인
      console.log("backend url = " + process.env.BACKEND_URL);
      const membershipResponse = await axios.get(
        `${process.env.BACKEND_URL}/api/v1/signal/servers/${serverId}/members/${socket.user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
            'X-User-ID': socket.user.id,
            'X-User-Token': socket.authToken,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("응답 반환 " + membershipResponse);
      if (membershipResponse.data) {
        const serverRoom = `server:${serverId}`;
        socket.join(serverRoom);
        socket.currentServer = serverId;

        // 서버의 역할 정보 캐싱
        socket.serverRoles = membershipResponse.data.roles || [];

        console.log(`${socket.user.username} joined server: ${serverId}`);

        // 서버 멤버들에게 알림
        socket.to(serverRoom).emit('server:user-joined', {
          userId: socket.user.id,
          username: socket.user.username,
          serverId: serverId
        });

        socket.emit('server:join:success', { serverId, roles: socket.serverRoles });
      }
    } catch (error) {
      console.error('Server join error:', error.message);
      socket.emit('error', {
        type: 'server_join_error',
        message: 'Failed to join server'
      });
    }
  });

  // 채널 입장
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

      const message = {
        serverId,
        channelId,
        userId: socket.user.id,
        username: socket.user.username,
        content,
        messageType,
        timestamp: new Date(),
        userToken: socket.authToken, // Signal Server API 인증용
        // 서버별 프로필 오버라이드 (역할 기반)
        serverProfile: {
          roles: socket.serverRoles,
          displayName: socket.user.username // TODO: 서버별 닉네임 지원
        }
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
      console.error('❌ Error handling chat message:', error.message);
      socket.emit('error', {
        type: 'chat_error',
        message: 'Failed to send message',
        details: error.message
      });
    }
  });

  // 채널별 타이핑 상태 전송
  socket.on('chat:typing', (data) => {
    const { serverId, channelId, isTyping } = data;

    if (socket.currentChannel?.serverId === serverId &&
      socket.currentChannel?.channelId === channelId) {
      const channelRoom = `server:${serverId}:channel:${channelId}`;
      socket.to(channelRoom).emit('chat:typing', {
        userId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId,
        isTyping
      });
    }
  });

  // 채널 탈퇴
  socket.on('channel:leave', (data) => {
    const { serverId, channelId } = data;
    const channelRoom = `server:${serverId}:channel:${channelId}`;

    socket.leave(channelRoom);
    socket.to(channelRoom).emit('channel:user-left', {
      userId: socket.user.id,
      username: socket.user.username,
      serverId,
      channelId
    });

    if (socket.currentChannel?.serverId === serverId &&
      socket.currentChannel?.channelId === channelId) {
      socket.currentChannel = null;
    }

    console.log(`${socket.user.username} left channel: ${serverId}/${channelId}`);
  });

  // 서버 탈퇴
  socket.on('server:leave', (data) => {
    const { serverId } = data;
    const serverRoom = `server:${serverId}`;

    socket.leave(serverRoom);
    socket.to(serverRoom).emit('server:user-left', {
      userId: socket.user.id,
      username: socket.user.username,
      serverId
    });

    if (socket.currentServer === serverId) {
      socket.currentServer = null;
      socket.currentChannel = null;
      socket.serverRoles = [];
    }

    console.log(`${socket.user.username} left server: ${serverId}`);
  });
};

// 서버-채널 구조 기반 음성 채팅 관련 이벤트 핸들러
const handleVoiceEvents = (socket) => {

  // 채널별 음성 채팅 참여
  socket.on('voice:join', async (data) => {
    try {
      const { serverId, channelId } = data;

      // 먼저 채널 입장을 시도 (자동 멤버십 생성)
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
        // 이미 멤버인 경우 무시 (409 Conflict)
        if (joinError.response?.status !== 409) {
          console.error('Voice channel join failed:', joinError.message);
          throw joinError;
        }
      }

      // 채널이 음성 지원하는지 확인
      const channelResponse = await axios.get(
        `${process.env.BACKEND_URL}/api/v1/signal/servers/${serverId}/channels/${channelId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
            'X-User-ID': socket.user.id,
            'X-User-Token': socket.authToken,
            'Content-Type': 'application/json'
          }
        }
      );

      const channel = channelResponse.data;
      if (channel.type !== 'VOICE' && channel.type !== 'BOTH') {
        socket.emit('error', {
          type: 'voice_not_supported',
          message: 'This channel does not support voice chat'
        });
        return;
      }

      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;
      socket.join(voiceRoom);
      socket.currentVoiceChannel = { serverId, channelId };

      // 음성 세션 로그 시작 (TODO: 백엔드 API 구현 필요)
      try {
        console.log(`🎤 Voice session started: ${socket.user.username} in ${serverId}/${channelId}`);
        // TODO: 백엔드에 voice session API 엔드포인트 구현 후 활성화
        // await axios.post(`${process.env.BACKEND_URL}/api/v1/signal/voice/sessions/start`, ...);
      } catch (logError) {
        console.warn('Voice session logging failed:', logError.message);
      }

      // 현재 음성 채널에 있는 사용자 목록 가져오기
      const socketsInRoom = await io.in(voiceRoom).fetchSockets();
      const currentUsers = socketsInRoom
        .filter(s => s.id !== socket.id)
        .map(s => ({
          id: s.user.id,
          userId: s.user.id,
          username: s.user.username,
          serverId,
          channelId,
          isMuted: s.voiceStatus?.isMuted || false,
          isDeafened: s.voiceStatus?.isDeafened || false,
          isScreenSharing: s.voiceStatus?.isScreenSharing || false
        }));

      // 채널의 다른 음성 참여자들에게 알림
      socket.to(voiceRoom).emit('voice:user-joined', {
        id: socket.user.id,
        userId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId,
        isMuted: false,
        isDeafened: false,
        isScreenSharing: false
      });

      // 현재 사용자에게 성공 메시지와 함께 기존 사용자 목록 전송
      socket.emit('voice:join:success', { 
        serverId, 
        channelId,
        currentUsers 
      });

      // 기존 사용자들에게 새 피어 알림 (WebRTC 연결 시작용)
      socket.to(voiceRoom).emit('voice:new-peer', {
        peerId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId
      });

      console.log(`${socket.user.username} joined voice in channel: ${serverId}/${channelId}`);

    } catch (error) {
      console.error('Voice join error:', error.message);
      socket.emit('error', {
        type: 'voice_join_error',
        message: 'Failed to join voice channel'
      });
    }
  });

  // 채널별 음성 채팅 퇴장
  socket.on('voice:leave', async (data) => {
    try {
      const { serverId, channelId } = data || socket.currentVoiceChannel || {};

      if (serverId && channelId) {
        const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;
        socket.leave(voiceRoom);

        // 음성 세션 로그 종료 (TODO: 백엔드 API 구현 필요)
        try {
          console.log(`🎤 Voice session ended: ${socket.user.username} left ${serverId}/${channelId}`);
          // TODO: 백엔드에 voice session API 엔드포인트 구현 후 활성화
          // await axios.post(`${process.env.BACKEND_URL}/api/v1/signal/voice/sessions/end`, ...);
        } catch (logError) {
          console.warn('Voice session end logging failed:', logError.message);
        }

        socket.to(voiceRoom).emit('voice:user-left', {
          id: socket.user.id,
          userId: socket.user.id,
          username: socket.user.username,
          serverId,
          channelId
        });

        socket.currentVoiceChannel = null;
        console.log(`${socket.user.username} left voice in channel: ${serverId}/${channelId}`);
      }
    } catch (error) {
      console.error('Voice leave error:', error.message);
    }
  });

  // WebRTC 시그널링 (채널 기반)
  socket.on('voice:offer', (data) => {
    const { targetUserId, offer, serverId, channelId } = data;

    // 같은 음성 채널에 있는지 확인
    if (socket.currentVoiceChannel?.serverId === serverId &&
      socket.currentVoiceChannel?.channelId === channelId) {

      socket.to(targetUserId).emit('voice:offer', {
        from: socket.user.id,
        offer,
        serverId,
        channelId
      });
    }
  });

  socket.on('voice:answer', (data) => {
    const { targetUserId, answer, serverId, channelId } = data;

    if (socket.currentVoiceChannel?.serverId === serverId &&
      socket.currentVoiceChannel?.channelId === channelId) {

      socket.to(targetUserId).emit('voice:answer', {
        from: socket.user.id,
        answer,
        serverId,
        channelId
      });
    }
  });

  socket.on('voice:ice-candidate', (data) => {
    const { targetUserId, candidate, serverId, channelId } = data;

    if (socket.currentVoiceChannel?.serverId === serverId &&
      socket.currentVoiceChannel?.channelId === channelId) {

      socket.to(targetUserId).emit('voice:ice-candidate', {
        from: socket.user.id,
        candidate,
        serverId,
        channelId
      });
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
        volume,
        serverId,
        channelId
      });
    }
  });

  // 음성 상태 업데이트 (음소거, 화면 공유 등)
  socket.on('voice:status', (data) => {
    const { status, serverId, channelId } = data; // { isMuted, isDeafened, isScreenSharing }

    if (socket.currentVoiceChannel?.serverId === serverId &&
      socket.currentVoiceChannel?.channelId === channelId) {

      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;
      socket.to(voiceRoom).emit('voice:status', {
        userId: socket.user.id,
        username: socket.user.username,
        status,
        serverId,
        channelId
      });
    }
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

      const vote = await axios.post(`${process.env.BACKEND_URL}/api/v1/signal/votes`, {
        ...data,
        userId: socket.user.id,
        username: socket.user.username
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
          'X-User-ID': socket.user.id,
          'X-User-Token': socket.authToken,
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

      const announcement = await axios.post(`${process.env.BACKEND_URL}/api/v1/signal/announcements`, {
        ...data,
        userId: socket.user.id,
        username: socket.user.username
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
          'X-User-ID': socket.user.id,
          'X-User-Token': socket.authToken,
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
  socket.on('disconnect', async (reason) => {
    console.log(`User disconnected: ${socket.user.username} (${reason})`);

    // 음성 채팅에서 자동 퇴장
    if (socket.currentVoiceChannel) {
      const { serverId, channelId } = socket.currentVoiceChannel;
      const voiceRoom = `voice:server:${serverId}:channel:${channelId}`;

      socket.to(voiceRoom).emit('voice:user-left', {
        userId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId
      });

      // 음성 세션 종료 로그
      try {
        await axios.post(
          `${process.env.BACKEND_URL}/api/v1/signal/voice/sessions/end`,
          { serverId, channelId, userId: socket.user.id },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SIGNAL_SERVER_SECRET_TOKEN}`,
              'X-User-ID': socket.user.id,
              'X-User-Token': socket.authToken,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.warn('Voice session end logging failed:', error.message);
      }
    }

    // 현재 채널에서 퇴장 알림
    if (socket.currentChannel) {
      const { serverId, channelId } = socket.currentChannel;
      const channelRoom = `server:${serverId}:channel:${channelId}`;

      socket.to(channelRoom).emit('channel:user-left', {
        userId: socket.user.id,
        username: socket.user.username,
        serverId,
        channelId
      });
    }

    // 현재 서버에서 퇴장 알림
    if (socket.currentServer) {
      const serverRoom = `server:${socket.currentServer}`;

      socket.to(serverRoom).emit('server:user-left', {
        userId: socket.user.id,
        username: socket.user.username,
        serverId: socket.currentServer
      });
    }

    // 전역 사용자 연결 해제 알림 (레거시 지원)
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