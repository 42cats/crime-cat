package com.crimecat.backend.gameHistory.enums;

/**
 * 방탈출 성공 상태 enum
 */
public enum SuccessStatus {
    SUCCESS,   // 성공
    FAIL,      // 실패
    PARTIAL;   // 부분 성공
    
    /**
     * Boolean 값을 SuccessStatus로 변환 (이전 코드와의 호환성 유지)
     */
    public static SuccessStatus fromBoolean(Boolean isSuccess) {
        if (isSuccess == null) {
            return FAIL;
        }
        return isSuccess ? SUCCESS : FAIL;
    }
    
    /**
     * SuccessStatus를 Boolean으로 변환 (이전 코드와의 호환성 유지)
     */
    public Boolean toBoolean() {
        return this == SUCCESS;
    }
}