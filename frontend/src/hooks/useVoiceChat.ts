import { useEffect, useCallback, useState, useRef } from 'react';
import websocketService, { VoiceUser } from '../services/websocketService';
import { useAppStore } from '../store/useAppStore';
import { getRTCConfiguration, getAudioConstraints } from '../config/webrtc';

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

  // Voice channel join success handler
  const handleVoiceJoined = useCallback((data: { serverId: string; channelId: string; currentUsers?: VoiceUser[] }) => {
    console.log('Voice channel joined:', data);
    setCurrentVoiceChannel({ serverId: data.serverId, channelId: data.channelId });
    setVoiceConnected(true);
    
    // 기존 사용자 목록 설정
    if (data.currentUsers && data.currentUsers.length > 0) {
      console.log('Setting existing voice users:', data.currentUsers);
      setVoiceUsers(data.currentUsers);
      
      // 기존 사용자들과 WebRTC 연결 시작
      data.currentUsers.forEach(user => {
        initiateWebRTCConnection(user.id, data.serverId, data.channelId);
      });
    }
  }, [setVoiceConnected, setVoiceUsers]);

  // Voice member joined handler
  const handleVoiceMemberJoined = useCallback((user: VoiceUser) => {
    console.log('Voice member joined:', user);
    setVoiceUsers(prevUsers => {
      // 중복 방지
      const exists = prevUsers.some(u => (u.userId || u.id) === (user.userId || user.id));
      if (exists) {
        console.log('User already in voice channel, skipping:', user.userId || user.id);
        return prevUsers;
      }
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

  // WebRTC 연결 시작 함수
  const initiateWebRTCConnection = useCallback(async (targetUserId: string, serverId: string, channelId: string) => {
    console.log('Initiating WebRTC connection to:', targetUserId);
    
    try {
      // Create peer connection
      const pc = new RTCPeerConnection(getRTCConfiguration());

      peerConnections.current[targetUserId] = pc;

      // Add local stream
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track from:', targetUserId);
        setRemoteStreams(prev => ({
          ...prev,
          [targetUserId]: event.streams[0]
        }));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          websocketService.sendIceCandidate(targetUserId, event.candidate, serverId, channelId);
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      websocketService.sendOffer(targetUserId, offer, serverId, channelId);
    } catch (error) {
      console.error('Error initiating WebRTC connection:', error);
    }
  }, [localStream]);

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
      // Create peer connection
      const pc = new RTCPeerConnection(getRTCConfiguration());

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
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());
      
      setLocalStream(stream);
      
      // Join voice channel via WebSocket
      websocketService.joinVoiceChannel(serverId, channelId);
      
    } catch (error) {
      console.error('Failed to join voice channel:', error);
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