import { useEffect, useCallback, useState, useRef } from 'react';
import websocketService, { VoiceUser } from '../services/websocketService';
import { useAppStore } from '../store/useAppStore';

export interface UseVoiceChatReturn {
  voiceUsers: VoiceUser[];
  isVoiceConnected: boolean;
  localMuted: boolean;
  currentVoiceChannel?: { serverId: number; channelId: number };
  localStream: MediaStream | null;
  remoteStreams: { [userId: string]: MediaStream };
  joinVoiceChannel: (serverId: number, channelId: number) => Promise<void>;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  updateVoiceStatus: (serverId: number, channelId: number, status: {
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

  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<{ serverId: number; channelId: number } | undefined>();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [userId: string]: MediaStream }>({});
  
  // WebRTC peer connections
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const iceCandidateQueues = useRef<{ [userId: string]: RTCIceCandidateInit[] }>({});

  // Voice channel join success handler
  const handleVoiceJoined = useCallback((data: { serverId: number; channelId: number }) => {
    console.log('Voice channel joined:', data);
    setCurrentVoiceChannel({ serverId: data.serverId, channelId: data.channelId });
    setVoiceConnected(true);
  }, [setVoiceConnected]);

  // Voice member joined handler
  const handleVoiceMemberJoined = useCallback((user: VoiceUser) => {
    console.log('Voice member joined:', user);
    setVoiceUsers([...voiceUsers, user]);
  }, [voiceUsers, setVoiceUsers]);

  // Voice member left handler
  const handleVoiceMemberLeft = useCallback((user: VoiceUser) => {
    console.log('Voice member left:', user);
    setVoiceUsers(voiceUsers.filter(u => u.userId !== user.userId));
    
    // Clean up peer connection
    if (peerConnections.current[user.userId]) {
      peerConnections.current[user.userId].close();
      delete peerConnections.current[user.userId];
    }
    
    // Remove remote stream
    setRemoteStreams(prev => {
      const { [user.userId]: removed, ...rest } = prev;
      return rest;
    });
  }, [voiceUsers, setVoiceUsers]);

  // WebRTC signaling handlers
  const handleWebRTCOffer = useCallback(async (data: {
    from: string;
    offer: RTCSessionDescriptionInit;
    serverId: number;
    channelId: number;
  }) => {
    const { from, offer, serverId, channelId } = data;
    
    if (!currentVoiceChannel || 
        currentVoiceChannel.serverId !== serverId || 
        currentVoiceChannel.channelId !== channelId) {
      return;
    }

    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:your-turn-server.com:3478', username: 'username', credential: 'credential' }
        ]
      });

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
    serverId: number;
    channelId: number;
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
    serverId: number;
    channelId: number;
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

  // Setup event listeners
  useEffect(() => {
    websocketService.on('voice:joined', handleVoiceJoined);
    websocketService.on('voice:member:joined', handleVoiceMemberJoined);
    websocketService.on('voice:member:left', handleVoiceMemberLeft);
    websocketService.on('webrtc:offer', handleWebRTCOffer);
    websocketService.on('webrtc:answer', handleWebRTCAnswer);
    websocketService.on('webrtc:ice-candidate', handleWebRTCIceCandidate);

    return () => {
      websocketService.off('voice:joined', handleVoiceJoined);
      websocketService.off('voice:member:joined', handleVoiceMemberJoined);
      websocketService.off('voice:member:left', handleVoiceMemberLeft);
      websocketService.off('webrtc:offer', handleWebRTCOffer);
      websocketService.off('webrtc:answer', handleWebRTCAnswer);
      websocketService.off('webrtc:ice-candidate', handleWebRTCIceCandidate);
    };
  }, [
    handleVoiceJoined,
    handleVoiceMemberJoined,
    handleVoiceMemberLeft,
    handleWebRTCOffer,
    handleWebRTCAnswer,
    handleWebRTCIceCandidate
  ]);

  // Join voice channel
  const joinVoiceChannel = useCallback(async (serverId: number, channelId: number) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
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
  const updateVoiceStatus = useCallback((serverId: number, channelId: number, status: {
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