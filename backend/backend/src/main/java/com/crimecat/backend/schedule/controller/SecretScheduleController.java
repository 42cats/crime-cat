package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.service.ScheduleService;
import com.crimecat.backend.schedule.service.SecretScheduleService;
import com.crimecat.backend.schedule.service.SecretScheduleService.PasswordVerificationResult;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 비밀 일정 관리 API 컨트롤러
 * - 비밀번호 검증
 * - 이벤트 미리보기
 * - 인증 상태 확인
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/secret-schedule")
@RequiredArgsConstructor
public class SecretScheduleController {

    private final SecretScheduleService secretScheduleService;
    private final ScheduleService scheduleService;

    /**
     * 비밀 이벤트 비밀번호 검증
     */
    @PostMapping("/verify/{eventId}")
    public ResponseEntity<Map<String, Object>> verifyPassword(
            @PathVariable UUID eventId,
            @RequestBody PasswordVerificationRequest request,
            HttpServletRequest httpRequest) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 이벤트 조회
            Event event = scheduleService.getEventEntity(eventId);
            if (event == null) {
                response.put("success", false);
                response.put("message", "이벤트를 찾을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }

            if (!event.isSecretEvent()) {
                response.put("success", false);
                response.put("message", "비밀 일정이 아닙니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // 현재 사용자 정보
            WebUser user = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
            
            // 비밀번호 검증
            PasswordVerificationResult result = secretScheduleService.verifyPassword(
                event, request.getPassword(), user, httpRequest);

            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            
            if (result.isRateLimited()) {
                response.put("rateLimited", true);
                return ResponseEntity.status(429).body(response);
            }
            
            if (result.isSuccess()) {
                response.put("sessionId", result.getSessionId());
                log.info("비밀 일정 인증 성공: eventId={}, userId={}", 
                         eventId, user != null ? user.getId() : "anonymous");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("비밀번호 검증 중 오류 발생: eventId={}", eventId, e);
            response.put("success", false);
            response.put("message", "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 비밀 이벤트 미리보기 정보 조회
     * 비밀번호 입력 전에 볼 수 있는 제한된 정보만 제공
     */
    @GetMapping("/preview/{eventId}")
    public ResponseEntity<Map<String, Object>> getEventPreview(@PathVariable UUID eventId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Event event = scheduleService.getEventEntity(eventId);
            if (event == null) {
                return ResponseEntity.notFound().build();
            }

            if (!event.isSecretEvent()) {
                response.put("success", false);
                response.put("message", "비밀 일정이 아닙니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // 미리보기용 제한된 정보
            Map<String, Object> preview = new HashMap<>();
            preview.put("id", event.getId());
            preview.put("title", "🔒 비밀 일정");
            preview.put("category", event.getCategory());
            preview.put("isSecret", true);
            preview.put("hasPasswordHint", event.hasPasswordHint());
            
            if (event.hasPasswordHint()) {
                preview.put("passwordHint", event.getPasswordHint());
            }
            
            // 참여자 수는 보여주되, 구체적인 정보는 숨김
            preview.put("participantCount", "비밀 일정");
            preview.put("maxParticipants", event.getMaxParticipants());
            
            response.put("success", true);
            response.put("event", preview);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("비밀 이벤트 미리보기 조회 중 오류 발생: eventId={}", eventId, e);
            response.put("success", false);
            response.put("message", "서버 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 세션에서 이벤트 인증 상태 확인
     */
    @GetMapping("/verify-status/{eventId}")
    public ResponseEntity<Map<String, Object>> checkVerificationStatus(
            @PathVariable UUID eventId,
            HttpSession session) {
        
        Map<String, Object> response = new HashMap<>();
        
        boolean isVerified = secretScheduleService.isEventVerifiedInSession(session, eventId);
        
        response.put("verified", isVerified);
        response.put("eventId", eventId);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 비밀번호 복잡도 검증 (프론트엔드 실시간 검증용)
     */
    @PostMapping("/validate-password")
    public ResponseEntity<Map<String, Object>> validatePassword(
            @RequestBody PasswordValidationRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        var result = secretScheduleService.validatePasswordComplexity(request.getPassword());
        
        response.put("valid", result.isValid());
        response.put("message", result.getMessage());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 이벤트 보안 통계 조회 (관리자 전용)
     */
    @GetMapping("/stats/{eventId}")
    public ResponseEntity<Map<String, Object>> getSecurityStats(@PathVariable UUID eventId) {
        // TODO: 관리자 권한 체크 추가
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            var stats = secretScheduleService.getEventSecurityStats(eventId);
            
            response.put("success", true);
            response.put("stats", Map.of(
                "eventId", stats.getEventId(),
                "totalAttempts", stats.getTotalAttempts(),
                "successfulAttempts", stats.getSuccessfulAttempts(),
                "failedAttempts", stats.getFailedAttempts()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("보안 통계 조회 중 오류 발생: eventId={}", eventId, e);
            response.put("success", false);
            response.put("message", "통계 조회에 실패했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // DTO 클래스들
    public static class PasswordVerificationRequest {
        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Size(min = 1, max = 50, message = "비밀번호는 1-50자 사이여야 합니다.")
        private String password;

        // Getters and Setters
        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class PasswordValidationRequest {
        @Size(max = 50, message = "비밀번호는 최대 50자까지 가능합니다.")
        private String password;

        // Getters and Setters
        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}