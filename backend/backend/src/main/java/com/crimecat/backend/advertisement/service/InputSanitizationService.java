package com.crimecat.backend.advertisement.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.util.regex.Pattern;

/**
 * 입력 데이터 검증 및 정화 서비스
 * SQL Injection, XSS 등의 보안 위협으로부터 보호합니다.
 */
@Slf4j
@Service
public class InputSanitizationService {
    
    // 위험한 SQL 키워드 패턴 (JPA를 사용하므로 기본적으로 방지되지만 추가 보안)
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i).*(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror).*",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    // XSS 위험 패턴
    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(?i).*(<script|</script>|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=|<iframe|</iframe>).*",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    // 허용되지 않는 특수문자 패턴 (테마명, 사용자 입력에서)
    private static final Pattern SPECIAL_CHARS_PATTERN = Pattern.compile(
        ".*[<>\"'%;()&+\\-].*"
    );
    
    /**
     * 테마 이름을 검증하고 정화합니다.
     * @param themeName 테마 이름
     * @return 정화된 테마 이름
     * @throws IllegalArgumentException 위험한 패턴 발견 시
     */
    public String sanitizeThemeName(String themeName) {
        if (themeName == null || themeName.trim().isEmpty()) {
            throw new IllegalArgumentException("테마 이름은 필수입니다.");
        }
        
        String trimmed = themeName.trim();
        
        // SQL Injection 검사
        if (SQL_INJECTION_PATTERN.matcher(trimmed).matches()) {
            log.warn("SQL Injection 시도 감지 - 테마명: {}", trimmed);
            throw new IllegalArgumentException("테마 이름에 허용되지 않는 문자가 포함되어 있습니다.");
        }
        
        // XSS 검사
        if (XSS_PATTERN.matcher(trimmed).matches()) {
            log.warn("XSS 시도 감지 - 테마명: {}", trimmed);
            throw new IllegalArgumentException("테마 이름에 허용되지 않는 문자가 포함되어 있습니다.");
        }
        
        // 위험한 특수문자 검사
        if (SPECIAL_CHARS_PATTERN.matcher(trimmed).matches()) {
            log.warn("위험한 특수문자 감지 - 테마명: {}", trimmed);
            throw new IllegalArgumentException("테마 이름에 허용되지 않는 특수문자가 포함되어 있습니다.");
        }
        
        // HTML 인코딩으로 추가 보안
        String sanitized = HtmlUtils.htmlEscape(trimmed);
        
        log.debug("테마명 검증 완료: {} -> {}", themeName, sanitized);
        return sanitized;
    }
    
    /**
     * 광고 취소 사유를 검증하고 정화합니다.
     * @param reason 취소 사유
     * @return 정화된 취소 사유
     * @throws IllegalArgumentException 위험한 패턴 발견 시
     */
    public String sanitizeReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("취소 사유는 필수입니다.");
        }
        
        String trimmed = reason.trim();
        
        // SQL Injection 검사
        if (SQL_INJECTION_PATTERN.matcher(trimmed).matches()) {
            log.warn("SQL Injection 시도 감지 - 취소사유: {}", trimmed);
            throw new IllegalArgumentException("취소 사유에 허용되지 않는 문자가 포함되어 있습니다.");
        }
        
        // XSS 검사
        if (XSS_PATTERN.matcher(trimmed).matches()) {
            log.warn("XSS 시도 감지 - 취소사유: {}", trimmed);
            throw new IllegalArgumentException("취소 사유에 허용되지 않는 문자가 포함되어 있습니다.");
        }
        
        // HTML 인코딩 (취소 사유는 일부 특수문자 허용하되 HTML 인코딩)
        String sanitized = HtmlUtils.htmlEscape(trimmed);
        
        log.debug("취소사유 검증 완료: {} -> {}", reason, sanitized);
        return sanitized;
    }
    
    /**
     * UUID 문자열 형식을 검증합니다.
     * @param uuidString UUID 문자열
     * @throws IllegalArgumentException 잘못된 UUID 형식일 때
     */
    public void validateUuidFormat(String uuidString) {
        if (uuidString == null || uuidString.trim().isEmpty()) {
            throw new IllegalArgumentException("UUID는 필수입니다.");
        }
        
        // UUID 형식 검증 (8-4-4-4-12 패턴)
        Pattern uuidPattern = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
        );
        
        if (!uuidPattern.matcher(uuidString.trim()).matches()) {
            log.warn("잘못된 UUID 형식: {}", uuidString);
            throw new IllegalArgumentException("잘못된 UUID 형식입니다.");
        }
    }
    
    /**
     * 숫자 범위를 검증합니다.
     * @param value 검증할 값
     * @param min 최소값
     * @param max 최대값
     * @param fieldName 필드 이름 (오류 메시지용)
     * @throws IllegalArgumentException 범위를 벗어날 때
     */
    public void validateNumberRange(int value, int min, int max, String fieldName) {
        if (value < min || value > max) {
            log.warn("숫자 범위 초과: {}={}, 허용범위: {}-{}", fieldName, value, min, max);
            throw new IllegalArgumentException(
                String.format("%s는 %d 이상 %d 이하여야 합니다.", fieldName, min, max)
            );
        }
    }
}