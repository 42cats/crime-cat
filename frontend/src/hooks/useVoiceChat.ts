import { useEffect, useCallback, useState, useRef } from 'react';
import websocketService, { VoiceUser } from '../services/websocketService';
import { useAppStore } from '../store/useAppStore';
import { createPeerConnection, getAudioConstraints, createPeerConnectionSync } from '../config/webrtc';

export interface UseVoiceChatReturn {
  voiceUsers: VoiceUser[];
  isVoiceConnected: boolean;
  localMuted: boolean;
  currentVoiceChannel?: { serverId: string; channelId: string };
  localStream: MediaStream | null;
  remoteStreams: { [userId: string]: MediaStream };
  joinVoiceChannel: (serverId: string, channelId: string) => Promise<void>;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  updateVoiceStatus: (serverId: string, channelId: string, status: {
    isMuted?: boolean;
    isDeafened?: boolean;
    isScreenSharing?: boolean;
  }) => void;
  onVoiceJoined: (callback: (data: any) => void) => () => void;
  onVoiceMemberJoined: (callback: (user: VoiceUser) => void) => () => void;
  onVoiceMemberLeft: (callback: (user: VoiceUser) => void) => () => void;
}

export const useVoiceChat = (): UseVoiceChatReturn => {
  const {
    voiceUsers,
    isVoiceConnected,
    localMuted,
    setVoiceUsers,
    setVoiceConnected,
    setLocalMuted
  } = useAppStore();

  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<{ serverId: string; channelId: string } | undefined>();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [userId: string]: MediaStream }>({});
  
  // WebRTC peer connections
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const iceCandidateQueues = useRef<{ [userId: string]: RTCIceCandidateInit[] }>({});

  // WebRTC 연결 시작 함수 (먼저 정의)
  const initiateWebRTCConnection = useCallback(async (targetUserId: string, serverId: string, channelId: string) => {
    console.log('');
    console.log('🔗 ========== WebRTC 연결 시작 ==========');
    console.log('🎯 Target User ID:', targetUserId);
    console.log('🏠 Server ID:', serverId);
    console.log('📺 Channel ID:', channelId);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    try {
      // Create peer connection with Cloudflare TURN
      console.log('📋 1단계: Cloudflare RTCPeerConnection 생성...');
      
      // 사용자 ID와 채널 ID를 사용하여 동적 TURN 자격증명 획득
      const { user } = useAppStore.getState();
      const userId = user?.id || 'anonymous';
      
      const pc = await createPeerConnection(userId, channelId);
      console.log('✅ Cloudflare RTCPeerConnection 생성 성공!');
      console.log('🔧 Connection State:', pc.connectionState);
      console.log('🧊 ICE Connection State:', pc.iceConnectionState);
      console.log('📡 ICE Gathering State:', pc.iceGatheringState);

      peerConnections.current[targetUserId] = pc;

      // Add local stream
      console.log('📋 3단계: Local Stream 추가...');
      if (localStream) {
        console.log('✅ Local Stream 발견!');
        console.log('🎵 Stream ID:', localStream.id);
        console.log('🎤 Total Tracks:', localStream.getTracks().length);
        
        localStream.getTracks().forEach((track, index) => {
          console.log(`🎶 Track ${index + 1}:`, {
            kind: track.kind,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
            id: track.id
          });
          pc.addTrack(track, localStream);
        });
        console.log('✅ 모든 트랙이 PeerConnection에 추가됨');
      } else {
        console.warn('⚠️ Local Stream이 없습니다! WebRTC 연결이 제대로 작동하지 않을 수 있습니다.');
      }

      // Handle remote stream
      console.log('📋 4단계: Remote Stream 핸들러 설정...');
      pc.ontrack = (event) => {
        console.log('');
        console.log('📨 ========== Remote Track 수신 ==========');
        console.log('👤 From User ID:', targetUserId);
        console.log('🎵 Track Info:', {
          kind: event.track.kind,
          label: event.track.label,
          enabled: event.track.enabled,
          readyState: event.track.readyState
        });
        console.log('📺 Streams Count:', event.streams.length);
        if (event.streams[0]) {
          console.log('🎶 Stream ID:', event.streams[0].id);
          console.log('🎤 Stream Tracks:', event.streams[0].getTracks().length);
        }
        console.log('=====================================');
        
        setRemoteStreams(prev => ({
          ...prev,
          [targetUserId]: event.streams[0]
        }));
      };

      // Handle ICE candidates
      console.log('📋 5단계: ICE Candidate 핸들러 설정...');
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('');
          console.log('🧊 ========== ICE Candidate 생성 ==========');
          console.log('🎯 Target User:', targetUserId);
          console.log('🔗 Candidate Type:', event.candidate.type);
          console.log('📡 Protocol:', event.candidate.protocol);
          console.log('🌐 Address:', event.candidate.address);
          console.log('🔌 Port:', event.candidate.port);
          console.log('📋 Full Candidate:', event.candidate.candidate);
          console.log('🔢 Foundation:', event.candidate.foundation);
          console.log('📊 Priority:', event.candidate.priority);
          console.log('🏠 Related Address:', event.candidate.relatedAddress);
          console.log('🔗 Related Port:', event.candidate.relatedPort);
          
          // TURN 관련 특별 로깅
          if (event.candidate.type === 'relay') {
            console.log('🎉 ========== TURN RELAY 후보 생성! ==========');
            console.log('✅ TURN 서버 연결 성공!');
            console.log('🔐 인증이 성공적으로 완료됨');
            console.log('=====================================');
          }
          
          console.log('📤 ICE Candidate를 WebSocket으로 전송...');
          websocketService.sendIceCandidate(targetUserId, event.candidate, serverId, channelId);
          console.log('✅ ICE Candidate 전송 완료');
          console.log('=====================================');
        } else {
          console.log('🏁 ICE Candidate 수집 완료 (null candidate 수신)');
        }
      };

      // Create and send offer
      console.log('📋 6단계: Offer 생성 및 전송...');
      const offer = await pc.createOffer();
      console.log('✅ Offer 생성 성공:', {
        type: offer.type,
        sdpLength: offer.sdp?.length || 0
      });
      
      await pc.setLocalDescription(offer);
      console.log('✅ Local Description 설정 완료');
      console.log('🔧 Updated Connection State:', pc.connectionState);
      console.log('🧊 Updated ICE Connection State:', pc.iceConnectionState);
      console.log('📡 Updated ICE Gathering State:', pc.iceGatheringState);
      
      console.log('📤 Offer를 WebSocket으로 전송...');
      websocketService.sendOffer(targetUserId, offer, serverId, channelId);
      console.log('✅ Offer 전송 완료');
      console.log('🎉 WebRTC 연결 초기화 완료!');
      console.log('=====================================');
      
    } catch (error) {
      console.log('');
      console.error('❌ ========== WebRTC 연결 실패 ==========');
      console.error('🎯 Target User:', targetUserId);
      console.error('📋 Error Details:', error);
      console.error('📊 Error Name:', error instanceof Error ? error.name : 'Unknown');
      console.error('💬 Error Message:', error instanceof Error ? error.message : String(error));
      console.error('🔧 Stack Trace:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('=====================================');
    }
  }, [localStream]);

  // Voice channel join success handler
  const handleVoiceJoined = useCallback((data: { serverId: string; channelId: string; currentUsers?: VoiceUser[] }) => {
    console.log('');
    console.log('🎉 ========== 음성 채널 참가 성공! ==========');
    console.log('📨 Server Response:', JSON.stringify(data, null, 2));
    console.log('🏠 Server ID:', data.serverId);
    console.log('📺 Channel ID:', data.channelId);
    console.log('👥 Current Users Count:', data.currentUsers?.length || 0);
    
    setCurrentVoiceChannel({ serverId: data.serverId, channelId: data.channelId });
    setVoiceConnected(true);
    console.log('✅ 음성 채널 상태 업데이트 완료');
    
    // 기존 사용자 목록 설정
    if (data.currentUsers && data.currentUsers.length > 0) {
      console.log('');
      console.log('👥 ========== 기존 사용자와 WebRTC 연결 시작 ==========');
      data.currentUsers.forEach((user, index) => {
        console.log(`👤 User ${index + 1}:`, {
          id: user.id,
          userId: user.userId,
          username: user.username
        });
      });
      
      setVoiceUsers(data.currentUsers);
      
      // localStream이 준비되면 WebRTC 연결 시작
      let connectionAttempts = 0;
      const maxAttempts = 50; // 5초 대기
      
      const startConnections = () => {
        connectionAttempts++;
        console.log(`🔄 WebRTC 연결 시도 ${connectionAttempts}/${maxAttempts}...`);
        
        if (localStream) {
          console.log('🎵 Local Stream 준비 완료! WebRTC 연결 시작...');
          data.currentUsers!.forEach((user, index) => {
            console.log(`🔗 ${index + 1}/${data.currentUsers!.length}: ${user.username} (${user.id})와 연결 시작`);
            initiateWebRTCConnection(user.id, data.serverId, data.channelId);
          });
          console.log('✅ 모든 기존 사용자와의 WebRTC 연결 초기화 완료');
          console.log('=====================================');
        } else if (connectionAttempts < maxAttempts) {
          console.log(`⏳ Local Stream 대기 중... (${connectionAttempts}/${maxAttempts})`);
          setTimeout(startConnections, 100);
        } else {
          console.error('❌ Local Stream 준비 시간 초과! WebRTC 연결을 시작할 수 없습니다.');
          console.error('=====================================');
        }
      };
      
      startConnections();
    } else {
      console.log('📭 채널에 다른 사용자가 없습니다. WebRTC 연결을 시작하지 않습니다.');
      console.log('=====================================');
    }
  }, [setVoiceConnected, setVoiceUsers, localStream, initiateWebRTCConnection]);

  // Voice member joined handler
  const handleVoiceMemberJoined = useCallback((user: VoiceUser) => {
    console.log('');
    console.log('👋 ========== 새로운 사용자 음성 참가 ==========');
    console.log('👤 User Info:', JSON.stringify(user, null, 2));
    console.log('🔍 User ID:', user.userId || user.id);
    console.log('📝 Username:', user.username);
    
    setVoiceUsers(prevUsers => {
      // 중복 방지
      const exists = prevUsers.some(u => (u.userId || u.id) === (user.userId || user.id));
      if (exists) {
        console.log('⚠️ 사용자가 이미 음성 채널에 있습니다. 건너뜀:', user.userId || user.id);
        console.log('=====================================');
        return prevUsers;
      }
      console.log('✅ 새로운 사용자를 음성 채널 목록에 추가');
      console.log('📊 현재 총 사용자 수:', prevUsers.length + 1);
      console.log('=====================================');
      return [...prevUsers, user];
    });
  }, [setVoiceUsers]);

  // Voice member left handler
  const handleVoiceMemberLeft = useCallback((user: VoiceUser) => {
    console.log('Voice member left:', user);
    const userId = user.userId || user.id;
    
    setVoiceUsers(prevUsers => prevUsers.filter(u => (u.userId || u.id) !== userId));
    
    // Clean up peer connection
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
    
    // Remove remote stream
    setRemoteStreams(prev => {
      const { [userId]: removed, ...rest } = prev;
      return rest;
    });
  }, [setVoiceUsers]);


  // WebRTC signaling handlers
  const handleWebRTCOffer = useCallback(async (data: {
    from: string;
    offer: RTCSessionDescriptionInit;
    serverId: string;
    channelId: string;
  }) => {
    const { from, offer, serverId, channelId } = data;
    
    if (!currentVoiceChannel || 
        currentVoiceChannel.serverId !== serverId || 
        currentVoiceChannel.channelId !== channelId) {
      return;
    }

    try {
      // Create peer connection with Cloudflare TURN
      const { user } = useAppStore.getState();
      const userId = user?.id || 'anonymous';
      
      const pc = await createPeerConnection(userId, channelId);
      peerConnections.current[from] = pc;

      // Add local stream
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStreams(prev => ({
          ...prev,
          [from]: event.streams[0]
        }));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          websocketService.sendIceCandidate(from, event.candidate, serverId, channelId);
        }
      };

      // Set remote description
      await pc.setRemoteDescription(offer);
      
      // Process queued ICE candidates
      if (iceCandidateQueues.current[from]) {
        for (const candidate of iceCandidateQueues.current[from]) {
          await pc.addIceCandidate(candidate);
        }
        delete iceCandidateQueues.current[from];
      }

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      websocketService.sendAnswer(from, answer, serverId, channelId);
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  }, [currentVoiceChannel, localStream]);

  const handleWebRTCAnswer = useCallback(async (data: {
    from: string;
    answer: RTCSessionDescriptionInit;
    serverId: string;
    channelId: string;
  }) => {
    const { from, answer } = data;
    const pc = peerConnections.current[from];
    
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
        
        // Process queued ICE candidates
        if (iceCandidateQueues.current[from]) {
          for (const candidate of iceCandidateQueues.current[from]) {
            await pc.addIceCandidate(candidate);
          }
          delete iceCandidateQueues.current[from];
        }
      } catch (error) {
        console.error('Error handling WebRTC answer:', error);
      }
    }
  }, []);

  const handleWebRTCIceCandidate = useCallback(async (data: {
    from: string;
    candidate: RTCIceCandidateInit;
    serverId: string;
    channelId: string;
  }) => {
    const { from, candidate } = data;
    const pc = peerConnections.current[from];
    
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    } else {
      // Queue ICE candidate for later
      if (!iceCandidateQueues.current[from]) {
        iceCandidateQueues.current[from] = [];
      }
      iceCandidateQueues.current[from].push(candidate);
    }
  }, []);

  // 새로운 피어 참가 핸들러
  const handleNewPeer = useCallback(async (data: {
    userId: string;
    username: string;
    serverId: string;
    channelId: string;
  }) => {
    console.log('New peer joined, initiating connection:', data.userId);
    
    if (currentVoiceChannel && 
        currentVoiceChannel.serverId === data.serverId && 
        currentVoiceChannel.channelId === data.channelId) {
      await initiateWebRTCConnection(data.userId, data.serverId, data.channelId);
    }
  }, [currentVoiceChannel, initiateWebRTCConnection]);

  // Setup event listeners
  useEffect(() => {
    websocketService.on('voice:joined', handleVoiceJoined);
    websocketService.on('voice:member:joined', handleVoiceMemberJoined);
    websocketService.on('voice:member:left', handleVoiceMemberLeft);
    websocketService.on('voice:new-peer', handleNewPeer);
    websocketService.on('webrtc:offer', handleWebRTCOffer);
    websocketService.on('webrtc:answer', handleWebRTCAnswer);
    websocketService.on('webrtc:ice-candidate', handleWebRTCIceCandidate);

    return () => {
      websocketService.off('voice:joined', handleVoiceJoined);
      websocketService.off('voice:member:joined', handleVoiceMemberJoined);
      websocketService.off('voice:member:left', handleVoiceMemberLeft);
      websocketService.off('voice:new-peer', handleNewPeer);
      websocketService.off('webrtc:offer', handleWebRTCOffer);
      websocketService.off('webrtc:answer', handleWebRTCAnswer);
      websocketService.off('webrtc:ice-candidate', handleWebRTCIceCandidate);
    };
  }, [
    handleVoiceJoined,
    handleVoiceMemberJoined,
    handleVoiceMemberLeft,
    handleNewPeer,
    handleWebRTCOffer,
    handleWebRTCAnswer,
    handleWebRTCIceCandidate
  ]);

  // Join voice channel
  const joinVoiceChannel = useCallback(async (serverId: string, channelId: string) => {
    try {
      console.log('');
      console.log('🎤 ========== 음성 채널 참가 시작 ==========');
      console.log('🏠 Server ID:', serverId);
      console.log('📺 Channel ID:', channelId);
      console.log('⏰ Timestamp:', new Date().toISOString());
      
      console.log('📋 1단계: 사용자 미디어 권한 요청...');
      const audioConstraints = getAudioConstraints();
      console.log('🎛️ Audio Constraints:', JSON.stringify(audioConstraints, null, 2));
      
      // Get user media first
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      console.log('✅ 사용자 미디어 획득 성공!');
      console.log('🎵 Stream Info:', {
        id: stream.id,
        active: stream.active,
        totalTracks: stream.getTracks().length
      });
      
      stream.getTracks().forEach((track, index) => {
        console.log(`🎶 Track ${index + 1}:`, {
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      });
      
      setLocalStream(stream);
      console.log('✅ Local Stream 상태 업데이트 완료');
      
      // Wait a bit for state to update, then join voice channel
      console.log('📋 2단계: WebSocket을 통한 음성 채널 참가...');
      setTimeout(() => {
        console.log('📤 WebSocket 음성 채널 참가 요청 전송...');
        websocketService.joinVoiceChannel(serverId, channelId);
        console.log('✅ 음성 채널 참가 요청 완료');
        console.log('=====================================');
      }, 100);
      
    } catch (error) {
      console.log('');
      console.error('❌ ========== 음성 채널 참가 실패 ==========');
      console.error('🏠 Server ID:', serverId);
      console.error('📺 Channel ID:', channelId);
      console.error('📋 Error Details:', error);
      console.error('📊 Error Name:', error instanceof Error ? error.name : 'Unknown');
      console.error('💬 Error Message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.error('🎤 마이크 권한이 거부되었습니다!');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        console.error('🎤 마이크 장치를 찾을 수 없습니다!');
      }
      console.error('=====================================');
      throw error;
    }
  }, []);

  // Leave voice channel
  const leaveVoiceChannel = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    
    // Clear remote streams
    setRemoteStreams({});
    
    // Leave via WebSocket
    websocketService.leaveVoiceChannel();
    
    setCurrentVoiceChannel(undefined);
    setVoiceConnected(false);
    setVoiceUsers([]);
  }, [localStream, setVoiceConnected, setVoiceUsers]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const shouldMute = !localMuted;
    setLocalMuted(shouldMute);
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !shouldMute;
      });
    }
    
    if (currentVoiceChannel) {
      updateVoiceStatus(currentVoiceChannel.serverId, currentVoiceChannel.channelId, {
        isMuted: shouldMute
      });
    }
  }, [localMuted, localStream, currentVoiceChannel, setLocalMuted]);

  // Update voice status
  const updateVoiceStatus = useCallback((serverId: string, channelId: string, status: {
    isMuted?: boolean;
    isDeafened?: boolean;
    isScreenSharing?: boolean;
  }) => {
    websocketService.updateVoiceStatus(serverId, channelId, status);
  }, []);

  // Event callback setters
  const onVoiceJoined = useCallback((callback: (data: any) => void) => {
    websocketService.on('voice:joined', callback);
    return () => websocketService.off('voice:joined', callback);
  }, []);

  const onVoiceMemberJoined = useCallback((callback: (user: VoiceUser) => void) => {
    websocketService.on('voice:member:joined', callback);
    return () => websocketService.off('voice:member:joined', callback);
  }, []);

  const onVoiceMemberLeft = useCallback((callback: (user: VoiceUser) => void) => {
    websocketService.on('voice:member:left', callback);
    return () => websocketService.off('voice:member:left', callback);
  }, []);

  return {
    voiceUsers,
    isVoiceConnected,
    localMuted,
    currentVoiceChannel,
    localStream,
    remoteStreams,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    updateVoiceStatus,
    onVoiceJoined,
    onVoiceMemberJoined,
    onVoiceMemberLeft
  };
};