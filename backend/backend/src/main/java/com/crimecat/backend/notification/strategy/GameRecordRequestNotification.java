package com.crimecat.backend.notification.strategy;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.dto.form.DateField;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.dto.form.HiddenField;
import com.crimecat.backend.notification.dto.form.SelectField;
import com.crimecat.backend.notification.dto.form.TextField;
import com.crimecat.backend.notification.enums.ActionButtonType;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.utils.JsonUtil;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 게임 기록 등록 요청 알림 전략
 * 특정 게임에 대한 기록 등록을 요청하고 승인/거절을 처리
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GameRecordRequestNotification implements NotificationStrategy {
    
    // TODO: 실제 서비스 인젝션이 필요합니다. 현재는 스켈레톤 구현
    // private final GameThemeService gameThemeService;
    // private final UserService userService;
    // private final GameHistoryService gameHistoryService;
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        // 기본 폼 필드 (승인/거절 모두 공통)
        return Arrays.asList(
            HiddenField.builder()
                .name("notificationId")
                .defaultValue(notificationId.toString())
                .build(),
            HiddenField.builder()
                .name("gameThemeId")
                .defaultValue(extractGameThemeId(data))
                .build(),
            HiddenField.builder()
                .name("requesterId")
                .defaultValue(extractRequesterId(data))
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        return Arrays.asList(
            ActionButton.builder()
                .type(ActionButtonType.ACCEPT)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(true)
                .build(),
            ActionButton.builder()
                .type(ActionButtonType.DECLINE)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(true)
                .build()
        );
    }
    
    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.GAME_RECORD_REQUEST;
    }
    
    @Override
    public void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData) {
        log.info("게임 기록 요청 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
        try {
            switch (actionType.toUpperCase()) {
                case "ACCEPT":
                    handleAccept(notificationId, actionData);
                    break;
                case "DECLINE":
                    handleDecline(notificationId, actionData);
                    break;
                default:
                    throw new IllegalArgumentException("지원하지 않는 액션 타입: " + actionType);
            }
        } catch (Exception e) {
            log.error("게임 기록 요청 알림 액션 처리 실패", e);
            throw new RuntimeException("게임 기록 요청 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleAccept(UUID notificationId, Map<String, Object> actionData) {
        log.info("게임 기록 요청 승인: notificationId={}", notificationId);
        
        try {
            // 1. 필요한 데이터 추출
            String gameThemeId = (String) actionData.get("gameThemeId");
            String requesterId = (String) actionData.get("requesterId");
            String isWinStr = (String) actionData.get("isWin");
            String createdAtStr = (String) actionData.get("createdAt");
            String characterName = (String) actionData.get("characterName");
            
            // 2. 데이터 변환
            boolean isWin = "WIN".equals(isWinStr);
            LocalDateTime createdAt = LocalDateTime.parse(createdAtStr + "T00:00:00"); // 날짜를 LocalDateTime으로 변환
            
            // TODO: 실제 서비스 호출로 대체 필요
            // 3. 엔티티 조회
            // GameTheme gameTheme = gameThemeService.findById(UUID.fromString(gameThemeId));
            // User requester = userService.findById(UUID.fromString(requesterId));
            
            // 4. Guild 결정
            // Guild guild = determineGuild(gameTheme);
            
            // 5. GameHistory 생성
            // GameHistory gameHistory = new GameHistory(isWin, createdAt, characterName, requester, guild, gameTheme);
            // gameHistoryService.save(gameHistory);
            
            // 6. 요청자에게 승인 알림 발송
            // sendAcceptNotification(requester, gameTheme);
            
            log.info("게임 기록 생성 완료: gameThemeId={}, requesterId={}, isWin={}", gameThemeId, requesterId, isWin);
            
        } catch (Exception e) {
            log.error("게임 기록 승인 처리 실패", e);
            throw new RuntimeException("게임 기록 승인 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleDecline(UUID notificationId, Map<String, Object> actionData) {
        String gameThemeId = (String) actionData.get("gameThemeId");
        String requesterId = (String) actionData.get("requesterId");
        String declineMessage = (String) actionData.get("declineMessage");
        
        log.info("게임 기록 요청 거절: notificationId={}, message={}", notificationId, declineMessage);
        
        // TODO: 실제 구현
        // 1. 요청자에게 거절 알림 발송 (메시지 포함)
        // sendDeclineNotification(requesterId, gameThemeId, declineMessage);
    }
    
    /**
     * 동적 폼 생성을 위한 메서드
     * 액션 타입에 따라 다른 폼 필드를 반환
     */
    public List<FormField> buildDynamicFormFields(UUID notificationId, String data, String actionType) {
        List<FormField> baseFields = buildFormFields(notificationId, data);
        
        if ("ACCEPT".equals(actionType)) {
            // 승인 시 추가 필드
            baseFields.addAll(Arrays.asList(
                SelectField.builder()
                    .name("isWin")
                    .label("승리 여부")
                    .required(true)
                    .options(this.createWinOptions())
                    .build(),
                DateField.builder()
                    .name("createdAt")
                    .label("게임 날짜")
                    .required(true)
                    .build(),
                TextField.builder()
                    .name("characterName")
                    .label("캐릭터 이름")
                    .required(true)
                    .build()
            ));
        } else if ("DECLINE".equals(actionType)) {
            // 거절 시 추가 필드
            baseFields.add(
                TextField.builder()
                    .name("declineMessage")
                    .label("거절 메시지")
                    .required(false)
                    .build()
            );
        }
        
        return baseFields;
    }
    
    private Map<String, Object> createWinOptions() {
        Map<String, Object> options = new LinkedHashMap<>();
        options.put("WIN", "승리");
        options.put("LOSE", "패배");
        return options;
    }
    
    private Guild determineGuild(GameTheme gameTheme) {
        if (gameTheme instanceof CrimesceneTheme) {
            return ((CrimesceneTheme) gameTheme).getGuild();
        } else {
            // 일반 GameTheme의 경우 - 현재는 null 반환
            // 차후 GameHistory의 Guild를 nullable로 변경 후 null 허용
            log.warn("일반 GameTheme에는 Guild 정보가 없습니다. GameTheme ID: {}", gameTheme.getId());
            return null; // 임시로 null 반환 (실제로는 예외 발생할 것)
        }
    }
    
    private String extractGameThemeId(String data) {
        try {
            return JsonUtil.extractField(data, "gameThemeId");
        } catch (Exception e) {
            log.error("게임 테마 ID 추출 실패: {}", data, e);
            return "";
        }
    }
    
    private String extractRequesterId(String data) {
        try {
            return JsonUtil.extractField(data, "requesterId");
        } catch (Exception e) {
            log.error("요청자 ID 추출 실패: {}", data, e);
            return "";
        }
    }
}
