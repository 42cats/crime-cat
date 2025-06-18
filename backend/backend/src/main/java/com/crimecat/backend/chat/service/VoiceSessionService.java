package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.dto.VoiceSessionDto;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VoiceSessionService {

    // 임시로 메모리에 저장 (실제로는 Redis나 DB 사용 권장)
    private final ConcurrentHashMap<String, VoiceSessionDto.Response> activeSessions = new ConcurrentHashMap<>();

    /**
     * 음성 세션 시작
     */
    public VoiceSessionDto.Response startSession(VoiceSessionDto.StartRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인 (현재 사용자가 요청한 사용자와 같아야 함)
        if (!currentUserId.equals(request.getUserId())) {
            throw new RuntimeException("권한이 없습니다");
        }

        String sessionKey = generateSessionKey(request.getServerId(), request.getChannelId(), request.getUserId());
        
        VoiceSessionDto.Response session = VoiceSessionDto.Response.builder()
                .sessionId(UUID.randomUUID())
                .serverId(request.getServerId())
                .channelId(request.getChannelId())
                .userId(request.getUserId())
                .username(request.getUsername())
                .startedAt(LocalDateTime.now())
                .isActive(true)
                .build();

        activeSessions.put(sessionKey, session);
        
        log.info("Voice session started: user {} in channel {}/{}", 
                request.getUserId(), request.getServerId(), request.getChannelId());

        return session;
    }

    /**
     * 음성 세션 종료
     */
    public void endSession(VoiceSessionDto.EndRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인
        if (!currentUserId.equals(request.getUserId())) {
            throw new RuntimeException("권한이 없습니다");
        }

        String sessionKey = generateSessionKey(request.getServerId(), request.getChannelId(), request.getUserId());
        
        VoiceSessionDto.Response session = activeSessions.get(sessionKey);
        if (session != null) {
            session.setEndedAt(LocalDateTime.now());
            session.setIsActive(false);
            activeSessions.remove(sessionKey);
            
            log.info("Voice session ended: user {} in channel {}/{}", 
                    request.getUserId(), request.getServerId(), request.getChannelId());
        }
    }

    /**
     * 활성 음성 세션 조회
     */
    @Transactional(readOnly = true)
    public VoiceSessionDto.ActiveSessionsResponse getActiveSessions(UUID serverId, UUID channelId) {
        List<VoiceSessionDto.ActiveSession> activeSessionList = new ArrayList<>();
        
        String channelPrefix = serverId + ":" + channelId + ":";
        
        activeSessions.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith(channelPrefix))
                .forEach(entry -> {
                    VoiceSessionDto.Response session = entry.getValue();
                    if (session.getIsActive()) {
                        activeSessionList.add(VoiceSessionDto.ActiveSession.builder()
                                .userId(session.getUserId())
                                .username(session.getUsername())
                                .joinedAt(session.getStartedAt())
                                .build());
                    }
                });

        return VoiceSessionDto.ActiveSessionsResponse.builder()
                .serverId(serverId)
                .channelId(channelId)
                .activeSessions(activeSessionList)
                .totalCount(activeSessionList.size())
                .build();
    }

    private String generateSessionKey(UUID serverId, UUID channelId, UUID userId) {
        return serverId + ":" + channelId + ":" + userId;
    }
}