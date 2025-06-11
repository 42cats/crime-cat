package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementQueueService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/theme-ads")
@RequiredArgsConstructor
public class ThemeAdvertisementRequestController {
    
    private final ThemeAdvertisementQueueService queueService;
    
    @PostMapping("/request")
    public ResponseEntity<?> requestAdvertisement(
            @AuthenticationPrincipal WebUser currentUser,
            @RequestBody RequestAdvertisementDto dto) {
        try {
            // 입력 검증
            if (dto.getRequestedDays() == null || dto.getRequestedDays() <= 0 || dto.getRequestedDays() > 15) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "광고 기간은 1일 이상 15일 이하로 설정해야 합니다."
                ));
            }
            
            UUID userId = currentUser.getId();
            
            ThemeAdvertisementRequest request = queueService.requestAdvertisement(
                userId, 
                dto.getThemeId(), 
                dto.getThemeName(),
                dto.getThemeType(),
                dto.getRequestedDays()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "광고 신청이 완료되었습니다.",
                "requestId", request.getId(),
                "status", request.getStatus(),
                "queuePosition", request.getQueuePosition()
            ));
            
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("광고 신청 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "서버 오류가 발생했습니다."
            ));
        }
    }
    
    @GetMapping("/my-requests")
    public ResponseEntity<List<ThemeAdvertisementRequest>> getMyRequests(
            @AuthenticationPrincipal WebUser currentUser) {
        UUID userId = currentUser.getId();
        List<ThemeAdvertisementRequest> requests = queueService.getUserAdvertisements(userId);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/queue-status")
    public ResponseEntity<?> getQueueStatus() {
        List<ThemeAdvertisementRequest> activeAds = queueService.getActiveAdvertisements();
        List<ThemeAdvertisementRequest> queuedAds = queueService.getQueuedAdvertisements();
        
        return ResponseEntity.ok(Map.of(
            "activeCount", activeAds.size(),
            "maxActiveSlots", 15,
            "queuedCount", queuedAds.size(),
            "estimatedWaitTime", calculateEstimatedWaitTime(queuedAds.size())
        ));
    }
    
    @DeleteMapping("/request/{requestId}")
    public ResponseEntity<?> cancelRequest(
            @AuthenticationPrincipal WebUser currentUser,
            @PathVariable UUID requestId) {
        try {
            // 요청 소유자 확인은 서비스에서 처리
            queueService.cancelQueuedAdvertisement(requestId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "광고 신청이 취소되었습니다."
            ));
            
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("광고 취소 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "서버 오류가 발생했습니다."
            ));
        }
    }
    
    @DeleteMapping("/active/{requestId}")
    public ResponseEntity<?> cancelActiveRequest(
            @AuthenticationPrincipal WebUser currentUser,
            @PathVariable UUID requestId) {
        try {
            queueService.cancelActiveAdvertisement(requestId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "활성 광고가 취소되었습니다."
            ));
            
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("활성 광고 취소 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "서버 오류가 발생했습니다."
            ));
        }
    }
    
    @PostMapping("/click/{requestId}")
    public ResponseEntity<?> recordClick(@PathVariable UUID requestId) {
        queueService.recordClick(requestId);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/exposure/{requestId}")
    public ResponseEntity<?> recordExposure(@PathVariable UUID requestId) {
        queueService.recordExposure(requestId);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/track-click/{requestId}")
    public ResponseEntity<Void> trackAdvertisementClick(@PathVariable UUID requestId) {
        try {
            queueService.recordClick(requestId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // 클릭 추적 실패는 조용히 처리 (사용자 경험에 영향 없도록)
            return ResponseEntity.ok().build();
        }
    }
    
    @PostMapping("/calculate-refund")
    public ResponseEntity<?> calculateRefund(
            @AuthenticationPrincipal WebUser currentUser,
            @RequestBody CalculateRefundDto dto) {
        try {
            UUID userId = currentUser.getId();
            // TODO: 환불 금액 계산 로직 구현
            return ResponseEntity.ok(Map.of(
                "remainingDays", 5,
                "refundAmount", 500,
                "message", "5일 남아 500포인트가 환불됩니다."
            ));
        } catch (Exception e) {
            log.error("환불 계산 중 오류 발생", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    private String calculateEstimatedWaitTime(int queueSize) {
        if (queueSize == 0) return "즉시 활성화";
        if (queueSize <= 3) return "1-3일";
        if (queueSize <= 7) return "3-7일";
        if (queueSize <= 15) return "1-2주";
        return "2주 이상";
    }
    
    // DTO 클래스들
    public static class RequestAdvertisementDto {
        private UUID themeId;
        private String themeName;
        private ThemeAdvertisementRequest.ThemeType themeType;
        private Integer requestedDays;
        
        // Getters and Setters
        public UUID getThemeId() { return themeId; }
        public void setThemeId(UUID themeId) { this.themeId = themeId; }
        
        public String getThemeName() { return themeName; }
        public void setThemeName(String themeName) { this.themeName = themeName; }
        
        public ThemeAdvertisementRequest.ThemeType getThemeType() { return themeType; }
        public void setThemeType(ThemeAdvertisementRequest.ThemeType themeType) { this.themeType = themeType; }
        
        public Integer getRequestedDays() { return requestedDays; }
        public void setRequestedDays(Integer requestedDays) { this.requestedDays = requestedDays; }
    }
    
    public static class CalculateRefundDto {
        private UUID requestId;
        
        public UUID getRequestId() { return requestId; }
        public void setRequestId(UUID requestId) { this.requestId = requestId; }
    }
}