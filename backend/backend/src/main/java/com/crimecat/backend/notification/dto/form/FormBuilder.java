package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.ActionButtonType;
import com.crimecat.backend.notification.enums.NotificationType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 알림 타입에 따른 폼 필드와 액션 버튼을 동적으로 생성하는 유틸리티
 */
@Component
public class FormBuilder {
    
    /**
     * 알림 타입에 따른 폼 필드 생성
     */
    public List<FormField> buildFormForNotification(NotificationType type, UUID notificationId) {
        List<FormField> fields = new ArrayList<>();
        
        // 모든 알림에 공통으로 포함할 숨겨진 필드
        fields.add(HiddenField.builder()
            .name("notificationId")
            .defaultValue(notificationId.toString())
            .build());
        
        // 알림 타입별 특화 필드
        switch (type) {
            case RECORD_REQUEST:
                fields.add(TextField.builder()
                    .name("responseMessage")
                    .label("응답 메시지")
                    .required(false)
                    .description("요청에 대한 추가 메시지를 입력할 수 있습니다")
                    .build());
                break;
// 추후 구현예정
//            case FRIEND_REQUEST:
//                fields.add(SelectField.builder()
//                    .name("visibility")
//                    .label("친구 공개 범위")
//                    .required(false)
//                    .options(List.of(
//                        new SelectField.SelectOption("public", "전체 공개", true),
//                        new SelectField.SelectOption("friends", "친구만"),
//                        new SelectField.SelectOption("private", "비공개")
//                    ))
//                    .description("친구 추가 후 프로파일 공개 범위를 설정하세요")
//                    .build());
//                break;
                
            case GAME_NOTICE:
                // 게임 알림은 폼 불필요 (확인만)
                break;
                
            case COMMENT_ALERT:
                fields.add(TextField.builder()
                    .name("replyText")
                    .label("답글")
                    .required(false)
                    .build());
                break;
                
            case SYSTEM_NOTICE:
                // 시스템 알림은 폼 불필요
                break;
                
            case NEW_THEME:
                // 새 테마 알림은 확인만 필요 (폼 불필요)
                break;
                
            default:
                // 기본적으로는 메시지 입력 필드만 제공
                fields.add(TextField.builder()
                    .name("message")
                    .label("메시지")
                    .required(false)
                    .build());
        }
        
        return fields;
    }
    
    /**
     * 알림 타입에 따른 액션 버튼 생성
     */
    public List<ActionButton> buildActionsForNotification(NotificationType type, UUID notificationId) {
        List<ActionButton> buttons = new ArrayList<>();
        String baseUrl = "/api/notifications/" + notificationId + "/actions";
        
        switch (type) {
            case RECORD_REQUEST:
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.ACCEPT)
                    .actionUrl(baseUrl)
                    .requiresForm(true)
                    .build());
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.DECLINE)
                    .actionUrl(baseUrl)
                    .requiresForm(true)
                    .build());
                break;
                
            case FRIEND_REQUEST:
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.ACCEPT)
                    .actionUrl(baseUrl)
                    .requiresForm(true)
                    .build());
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.DECLINE)
                    .actionUrl(baseUrl)
                    .requiresForm(false)
                    .build());
                break;
                
            case GAME_NOTICE:
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.CONFIRM)
                    .actionUrl(baseUrl)
                    .requiresForm(false)
                    .build());
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.VIEW)
                    .label("게임 보기")
                    .actionUrl("/api/games/" + extractGameId(notificationId))
                    .requiresForm(false)
                    .build());
                break;
                
            case COMMENT_ALERT:
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.VIEW)
                    .label("댓글 보기")
                    .actionUrl(baseUrl)
                    .requiresForm(false)
                    .build());
                buttons.add(ActionButton.builder()
                    .id("reply")
                    .type(ActionButtonType.CONFIRM)
                    .label("답글 작성")
                    .actionUrl(baseUrl)
                    .requiresForm(true)
                    .build());
                break;
                
            case SYSTEM_NOTICE:
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.CONFIRM)
                    .actionUrl(baseUrl)
                    .requiresForm(false)
                    .build());
                break;
                
            case NEW_THEME:
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.ACCEPT)
                    .label("테마 적용")
                    .actionUrl(baseUrl)
                    .requiresForm(false)
                    .build());
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.IGNORE)
                    .label("나중에")
                    .actionUrl(baseUrl)
                    .requiresForm(false)
                    .build());
                break;
                
            default:
                // 기본 확인 버튼
                buttons.add(ActionButton.builder()
                    .type(ActionButtonType.CONFIRM)
                    .actionUrl(baseUrl)
                    .requiresForm(false)
                    .build());
        }
        
        return buttons;
    }
    
    /**
     * 알림 ID로부터 게임 ID 추출 (예시 구현)
     * 실제로는 알림 데이터에서 추출해야 함
     */
    private String extractGameId(UUID notificationId) {
        // TODO: 실제 구현 시 알림 데이터에서 gameId 추출
        return "game-id-placeholder";
    }
}