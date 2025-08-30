package com.crimecat.backend.schedule.service;

import lombok.Getter;

/**
 * 캘린더 동기화 결과를 담는 불변 객체
 * - 순수 함수형 접근을 위한 결과 컨테이너
 * - 엔티티 상태와 분리된 동기화 결과만 포함
 */
@Getter
public class SyncResult {
    
    private final boolean success;
    private final String calendarName;
    private final String errorMessage;
    private final SyncResultType type;
    
    public enum SyncResultType {
        SUCCESS,           // 완전한 성공
        PARTIAL_SUCCESS,   // 부분적 성공 (404 등)
        FAILURE           // 완전한 실패
    }
    
    private SyncResult(boolean success, String calendarName, String errorMessage, SyncResultType type) {
        this.success = success;
        this.calendarName = calendarName;
        this.errorMessage = errorMessage;
        this.type = type;
    }
    
    // 성공 결과 생성
    public static SyncResult success(String calendarName) {
        return new SyncResult(true, calendarName, null, SyncResultType.SUCCESS);
    }
    
    // 부분적 성공 결과 생성 (404 등)
    public static SyncResult partialSuccess(String reason) {
        return new SyncResult(true, null, reason, SyncResultType.PARTIAL_SUCCESS);
    }
    
    // 실패 결과 생성
    public static SyncResult failure(String errorMessage) {
        return new SyncResult(false, null, errorMessage, SyncResultType.FAILURE);
    }
    
    // 편의 메서드
    public boolean isSuccess() {
        return success;
    }
    
    public boolean isPartialSuccess() {
        return type == SyncResultType.PARTIAL_SUCCESS;
    }
    
    public boolean isFailure() {
        return type == SyncResultType.FAILURE;
    }
    
    public boolean hasCalendarName() {
        return calendarName != null && !calendarName.trim().isEmpty();
    }
    
    @Override
    public String toString() {
        return String.format("SyncResult{type=%s, success=%s, calendarName='%s', errorMessage='%s'}", 
                type, success, calendarName, errorMessage);
    }
}