/**
 * 메모리 기반 음성 상태 관리 시스템
 * Discord 스타일의 음성 채널 상태를 실시간으로 관리
 */
class VoiceStateManager {
  constructor() {
    // 음성 채널별 사용자 상태
    this.voiceChannels = new Map(); // channelKey -> Set of users
    
    // 사용자별 음성 상태
    this.userVoiceStates = new Map(); // userId -> VoiceState
    
    // 사용자별 Speaking 상태
    this.speakingStates = new Map(); // userId -> { isSpeaking, lastUpdate }
    
    // Socket ID 매핑 (연결 해제 시 정리용)
    this.socketToUser = new Map(); // socketId -> userId
    this.userToSocket = new Map(); // userId -> socketId
    
    console.log('🎤 VoiceStateManager 초기화 완료');
  }

  /**
   * 채널 키 생성
   */
  getChannelKey(serverId, channelId) {
    return `${serverId}:${channelId}`;
  }

  /**
   * 음성 채널 참가
   */
  joinVoiceChannel(userId, username, serverId, channelId, socketId, trackId = null) {
    const channelKey = this.getChannelKey(serverId, channelId);
    
    // 기존 음성 채널에서 퇴장 (Discord 스타일: 한 번에 하나의 음성 채널만)
    this.leaveAllVoiceChannels(userId);
    
    // 채널 사용자 목록에 추가
    if (!this.voiceChannels.has(channelKey)) {
      this.voiceChannels.set(channelKey, new Set());
    }
    
    const channelUsers = this.voiceChannels.get(channelKey);
    channelUsers.add(userId);
    
    // 사용자 음성 상태 설정
    const voiceState = {
      userId,
      username,
      serverId,
      channelId,
      channelKey,
      trackId,  // SFU trackId 추가
      isMuted: false,
      isDeafened: false,
      isScreenSharing: false,
      joinedAt: new Date(),
      lastActivity: new Date()
    };
    
    this.userVoiceStates.set(userId, voiceState);
    
    // Socket 매핑 업데이트
    this.socketToUser.set(socketId, userId);
    this.userToSocket.set(userId, socketId);
    
    console.log(`🎤 ${username} joined voice channel: ${channelKey}`);
    
    // 채널의 다른 사용자들 반환
    return this.getChannelUsers(serverId, channelId);
  }

  /**
   * 모든 음성 채널에서 퇴장
   */
  leaveAllVoiceChannels(userId) {
    const currentState = this.userVoiceStates.get(userId);
    if (!currentState) return null;
    
    const { channelKey, serverId, channelId } = currentState;
    
    // 채널에서 사용자 제거
    const channelUsers = this.voiceChannels.get(channelKey);
    if (channelUsers) {
      channelUsers.delete(userId);
      
      // 채널이 비어있으면 제거
      if (channelUsers.size === 0) {
        this.voiceChannels.delete(channelKey);
      }
    }
    
    // 사용자 상태 제거
    this.userVoiceStates.delete(userId);
    this.speakingStates.delete(userId);
    
    // Socket 매핑 정리
    const socketId = this.userToSocket.get(userId);
    if (socketId) {
      this.socketToUser.delete(socketId);
      this.userToSocket.delete(userId);
    }
    
    console.log(`🚪 User ${userId} left voice channel: ${channelKey}`);
    
    return { serverId, channelId, channelKey };
  }

  /**
   * Socket 연결 해제 시 정리
   */
  handleSocketDisconnect(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return null;
    
    return this.leaveAllVoiceChannels(userId);
  }

  /**
   * 음성 상태 업데이트 (음소거, 헤드셋 등)
   */
  updateVoiceStatus(userId, updates) {
    const voiceState = this.userVoiceStates.get(userId);
    if (!voiceState) return null;
    
    // 상태 업데이트
    if (updates.isMuted !== undefined) {
      voiceState.isMuted = updates.isMuted;
    }
    if (updates.isDeafened !== undefined) {
      voiceState.isDeafened = updates.isDeafened;
    }
    if (updates.isScreenSharing !== undefined) {
      voiceState.isScreenSharing = updates.isScreenSharing;
    }
    
    voiceState.lastActivity = new Date();
    
    console.log(`🔄 Voice status updated for ${userId}:`, updates);
    
    return voiceState;
  }

  /**
   * Speaking 상태 업데이트
   */
  updateSpeakingStatus(userId, isSpeaking) {
    const voiceState = this.userVoiceStates.get(userId);
    if (!voiceState) return null;
    
    // Speaking 상태 업데이트
    this.speakingStates.set(userId, {
      isSpeaking,
      lastUpdate: new Date()
    });
    
    voiceState.lastActivity = new Date();
    
    return {
      userId,
      username: voiceState.username,
      serverId: voiceState.serverId,
      channelId: voiceState.channelId,
      isSpeaking
    };
  }

  /**
   * 채널의 모든 사용자 조회
   */
  getChannelUsers(serverId, channelId) {
    const channelKey = this.getChannelKey(serverId, channelId);
    const channelUsers = this.voiceChannels.get(channelKey);
    
    if (!channelUsers) return [];
    
    const users = [];
    for (const userId of channelUsers) {
      const voiceState = this.userVoiceStates.get(userId);
      const speakingState = this.speakingStates.get(userId);
      
      if (voiceState) {
        users.push({
          userId: voiceState.userId,
          username: voiceState.username,
          isMuted: voiceState.isMuted,
          isDeafened: voiceState.isDeafened,
          isScreenSharing: voiceState.isScreenSharing,
          isSpeaking: speakingState?.isSpeaking || false,
          joinedAt: voiceState.joinedAt,
          lastActivity: voiceState.lastActivity
        });
      }
    }
    
    return users;
  }

  /**
   * 특정 사용자의 음성 상태 조회
   */
  getUserVoiceState(userId) {
    const voiceState = this.userVoiceStates.get(userId);
    const speakingState = this.speakingStates.get(userId);
    
    if (!voiceState) return null;
    
    return {
      ...voiceState,
      isSpeaking: speakingState?.isSpeaking || false
    };
  }

  /**
   * 사용자가 특정 채널에 있는지 확인
   */
  isUserInChannel(userId, serverId, channelId) {
    const voiceState = this.userVoiceStates.get(userId);
    return voiceState?.serverId === serverId && voiceState?.channelId === channelId;
  }

  /**
   * 전체 상태 통계
   */
  getStats() {
    return {
      totalChannels: this.voiceChannels.size,
      totalUsers: this.userVoiceStates.size,
      speakingUsers: Array.from(this.speakingStates.values()).filter(s => s.isSpeaking).length,
      channels: Array.from(this.voiceChannels.entries()).map(([key, users]) => ({
        channelKey: key,
        userCount: users.size
      }))
    };
  }

  /**
   * 정리 작업 (메모리 최적화)
   */
  cleanup() {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30분
    
    let cleanedCount = 0;
    
    for (const [userId, voiceState] of this.userVoiceStates) {
      const timeSinceActivity = now - voiceState.lastActivity;
      
      if (timeSinceActivity > inactiveThreshold) {
        this.leaveAllVoiceChannels(userId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive voice states`);
    }
    
    return cleanedCount;
  }
}

module.exports = VoiceStateManager;