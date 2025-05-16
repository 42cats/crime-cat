package com.crimecat.backend.notification.template;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 알림 템플릿 인터페이스
 * 각 알림 타입별로 고유한 템플릿을 정의하고 메시지를 생성
 */
public interface NotificationTemplate {
    
    /**
     * 알림 제목 생성
     * @param context 템플릿 변수들이 포함된 컨텍스트
     * @return 렌더링된 제목
     */
    String getTitle(Map<String, Object> context);
    
    /**
     * 알림 메시지 생성
     * @param context 템플릿 변수들이 포함된 컨텍스트
     * @return 렌더링된 메시지
     */
    String getMessage(Map<String, Object> context);
    
    /**
     * 기본 데이터 반환
     * 각 템플릿에서 필요한 기본 설정값들을 제공
     * @return 기본 데이터 맵
     */
    Map<String, Object> getDefaultData();
    
    /**
     * 기본 만료 시간 반환
     * 각 알림 타입별로 다른 만료 시간을 가질 수 있음
     * @return 만료 시간 (null이면 만료 없음)
     */
    default LocalDateTime getDefaultExpiresAt() {
        return null;
    }
    
    /**
     * 템플릿에서 지원하는 컨텍스트 키 목록
     * 개발자와 사용자가 사용 가능한 변수를 확인할 수 있도록 함
     * @return 지원하는 컨텍스트 키 집합
     */
    java.util.Set<String> getSupportedContextKeys();
    
    /**
     * 템플릿 검증
     * 필수 컨텍스트가 누락되었는지 확인
     * @param context 검증할 컨텍스트
     * @throws IllegalArgumentException 필수 컨텍스트가 누락된 경우
     */
    default void validate(Map<String, Object> context) {
        // 기본 구현: 필수 키 검증
        for (String requiredKey : getRequiredContextKeys()) {
            if (!context.containsKey(requiredKey)) {
                throw new IllegalArgumentException("Required context key missing: " + requiredKey);
            }
        }
    }
    
    /**
     * 필수 컨텍스트 키 목록
     * @return 필수 컨텍스트 키 집합
     */
    default java.util.Set<String> getRequiredContextKeys() {
        return java.util.Set.of();
    }
}
