package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementQueueService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.exception.ServiceException;
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
            
            // 입력 검증
            if (dto.getRequestId() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "광고 요청 ID가 필요합니다."
                ));
            }
            
            // 광고 요청 조회
            ThemeAdvertisementRequest request = queueService.getAdvertisementRequestById(dto.getRequestId())
                .orElseThrow(() -> ErrorStatus.ADVERTISEMENT_NOT_FOUND.asServiceException());
            
            // 소유권 검증
            if (!request.getUserId().equals(userId)) {
                throw ErrorStatus.FORBIDDEN.asServiceException();
            }
            
            // 환불 가능 상태 검증
            if (request.getStatus() == AdvertisementStatus.CANCELLED ||
                request.getStatus() == AdvertisementStatus.EXPIRED ||
                request.getStatus() == AdvertisementStatus.REFUNDED) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이미 취소되었거나 완료된 광고는 환불할 수 없습니다."
                ));
            }
            
            int refundAmount = 0;
            int remainingDays = 0;
            String message = "";
            
            if (request.getStatus() == AdvertisementStatus.PENDING_QUEUE) {
                // 대기 중인 광고는 전액 환불
                refundAmount = request.getTotalCost();
                remainingDays = request.getRequestedDays();
                message = "대기 중인 광고로 전액 환불됩니다.";
                
            } else if (request.getStatus() == AdvertisementStatus.ACTIVE) {
                // 활성 광고는 남은 일수만큼 부분 환불 (내림 처리)
                if (request.getRemainingDays() != null && request.getRemainingDays() > 0) {
                    remainingDays = request.getRemainingDays();
                    // 남은 일수 내림으로 환불 계산 (하루 = 100포인트)
                    refundAmount = remainingDays * 100;
                    
                    message = String.format("%d일 남아 %d포인트가 환불됩니다.", 
                        remainingDays, refundAmount);
                } else {
                    message = "광고 기간이 이미 종료되어 환불할 수 없습니다.";
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "remainingDays", remainingDays,
                "refundAmount", refundAmount,
                "originalAmount", request.getTotalCost(),
                "status", request.getStatus().name(),
                "message", message
            ));
            
        } catch (ServiceException e) {
            log.error("환불 계산 중 서비스 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("환불 계산 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "서버 오류가 발생했습니다."
            ));
        }
    }
    
    @PostMapping("/admin/force-cancel/{requestId}")
    public ResponseEntity<?> forceCancelAdvertisement(
            @AuthenticationPrincipal WebUser currentUser,
            @PathVariable UUID requestId,
            @RequestBody ForceCancelDto dto) {
        try {
            // 관리자 권한 확인
            if (currentUser.getRole().ordinal() < com.crimecat.backend.webUser.enums.UserRole.ADMIN.ordinal()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자만 강제 취소할 수 있습니다."
                ));
            }
            
            // 광고 요청 조회
            ThemeAdvertisementRequest request = queueService.getAdvertisementRequestById(requestId)
                .orElseThrow(() -> ErrorStatus.ADVERTISEMENT_NOT_FOUND.asServiceException());
            
            // 이미 취소된 광고인지 확인
            if (request.getStatus() == AdvertisementStatus.CANCELLED ||
                request.getStatus() == AdvertisementStatus.EXPIRED ||
                request.getStatus() == AdvertisementStatus.REFUNDED) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이미 취소되었거나 완료된 광고입니다."
                ));
            }
            
            // 강제 취소 처리
            boolean refunded = queueService.forceCancelAdvertisement(requestId, dto.getReason(), currentUser.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "광고가 강제 취소되었습니다.",
                "refunded", refunded,
                "reason", dto.getReason()
            ));
            
        } catch (ServiceException e) {
            log.error("강제 광고 취소 중 서비스 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("강제 광고 취소 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "서버 오류가 발생했습니다."
            ));
        }
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<?> getAdvertisementStatistics(
            @AuthenticationPrincipal WebUser currentUser,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID themeId) {
        try {
            UUID targetUserId = userId;
            
            // 권한 검증: 자신의 통계이거나 관리자인 경우만 조회 가능
            if (targetUserId != null && !targetUserId.equals(currentUser.getId())) {
                if (currentUser.getRole().ordinal() < com.crimecat.backend.webUser.enums.UserRole.ADMIN.ordinal()) {
                    return ResponseEntity.status(403).body(Map.of(
                        "success", false,
                        "message", "다른 사용자의 통계는 관리자만 조회할 수 있습니다."
                    ));
                }
            } else if (targetUserId == null) {
                // userId가 지정되지 않으면 현재 사용자의 통계
                targetUserId = currentUser.getId();
            }
            
            // 통계 조회
            Map<String, Object> statistics = queueService.getAdvertisementStatistics(targetUserId, themeId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "statistics", statistics
            ));
            
        } catch (Exception e) {
            log.error("광고 통계 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "서버 오류가 발생했습니다."
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
    
    public static class ForceCancelDto {
        private String reason;
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}