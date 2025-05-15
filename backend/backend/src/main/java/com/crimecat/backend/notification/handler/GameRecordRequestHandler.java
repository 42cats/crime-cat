package com.crimecat.backend.notification.handler;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.repository.CrimesceneThemeRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.dto.request.GameRecordAcceptDto;
import com.crimecat.backend.notification.dto.request.GameRecordDeclineDto;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.utils.JsonUtil;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 게임 기록 요청 알림 처리 핸들러
 */
@Component
@RequiredArgsConstructor
public class GameRecordRequestHandler extends AbstractNotificationHandler {
    
    private final GameHistoryRepository gameHistoryRepository;
    private final NotificationService notificationService;
    private final JsonUtil jsonUtil;
    private final UserRepository userRepository;
    private final GameThemeRepository gameThemeRepository;
    private final CrimesceneThemeRepository crimesceneThemeRepository;
    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.GAME_RECORD_REQUEST;
    }
    
    @Override
    public Set<String> getSupportedActions() {
        return Set.of("accept", "decline");
    }
    
    @Override
    public void handleAction(UUID notificationId, String action, Object requestBody) {
        switch (action) {
            case "accept" -> acceptGameRecord(notificationId, requestBody);
            case "decline" -> declineGameRecord(notificationId, requestBody);
            default -> throw ErrorStatus.INVALID_NOTIFICATION_ACTION.asServiceException();
        }
    }
    
    /**
     * 게임 기록 요청 승인 처리
     */
    private void acceptGameRecord(UUID notificationId, Object requestBody) {
        GameRecordAcceptDto dto = convertRequestBody(requestBody, GameRecordAcceptDto.class);
        Notification notification = findNotification(notificationId);
        
        // 사용자 조회
        User user = userRepository.findById(notification.getUserId())
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 게임 테마 조회 (알림 데이터에서 추출)
        UUID gameThemeId = extractGameThemeId(notification.getDataJson());
        GameTheme gameTheme = gameThemeRepository.findById(gameThemeId)
            .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);

        CrimesceneTheme crimesceneTheme = crimesceneThemeRepository.findById(gameThemeId)
            .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
        Guild guild = null;
        if(crimesceneTheme.getGuild() != null){
            guild = crimesceneTheme.getGuild();
        }

        // 게임 기록 생성
        GameHistory gameHistory = new GameHistory(
            dto.getIsWin(),
            dto.getGameDate(),
            dto.getCharacterName(),
            user,
            guild,
            gameTheme
        );
        
        gameHistoryRepository.save(gameHistory);
        
        // 요청자에게 승인 알림 발송
        UUID requesterId = extractRequesterId(notification.getDataJson());
        notificationService.createAndSendNotification(
            NotificationType.SYSTEM_NOTICE,
            requesterId,
            notification.getUserId(),
            "게임 기록 승인됨",
            "회원님의 게임 기록 요청이 승인되었습니다.",
            Map.of("originalNotificationId", notificationId.toString())
        );
        notification.setStatus(NotificationStatus.PROCESSED);
    }
    
    /**
     * 게임 기록 요청 거절 처리
     */
    private void declineGameRecord(UUID notificationId, Object requestBody) {
        GameRecordDeclineDto dto = convertRequestBody(requestBody, GameRecordDeclineDto.class);
        Notification notification = findNotification(notificationId);
        
        // 요청자에게 거절 알림 발송
        UUID requesterId = extractRequesterId(notification.getDataJson());
        notificationService.createAndSendNotification(
            NotificationType.SYSTEM_NOTICE,
            requesterId,
            notification.getUserId(),
            "게임 기록 거절됨",
            dto.getDeclineMessage(),
            Map.of("originalNotificationId", notificationId.toString())
        );
        notification.setStatus(NotificationStatus.PROCESSED);
    }
    
    /**
     * 알림 데이터에서 게임 테마 ID 추출
     */
    private UUID extractGameThemeId(String data) {
        return UUID.fromString(jsonUtil.extractField(data, "gameThemeId"));
    }
    
    /**
     * 알림 데이터에서 요청자 ID 추출
     */
    private UUID extractRequesterId(String data) {
        return UUID.fromString(jsonUtil.extractField(data, "requesterId"));
    }
}
