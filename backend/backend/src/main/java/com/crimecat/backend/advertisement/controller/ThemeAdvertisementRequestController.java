package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementQueueService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.exception.ServiceException;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/theme-ads")
@RequiredArgsConstructor
@Validated
public class ThemeAdvertisementRequestController {
    
    private final ThemeAdvertisementQueueService queueService;
    
    @PostMapping("/request")
    public ResponseEntity<?> requestAdvertisement(
            @Valid @RequestBody RequestAdvertisementDto dto) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.USER);
        try {
            UUID userId = currentUser.getId();
            
            ThemeAdvertisementRequest request = queueService.requestAdvertisement(
                userId, 
                dto.getThemeId(), 
                dto.getThemeName(),
                dto.getThemeType(),
                dto.getRequestedDays()
            );
            
            return ResponseEntity.ok(new AdvertisementRequestResponseDto(
                true,
                "광고 신청이 완료되었습니다.",
                request.getId(),
                request.getStatus(),
                request.getQueuePosition()
            ));
            
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(
                new BasicResponseDto(false, e.getMessage())
            );
        } catch (Exception e) {
            log.error("광고 신청 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(
                new BasicResponseDto(false, "서버 오류가 발생했습니다.")
            );
        }
    }
    
    @GetMapping("/my-requests")
    public ResponseEntity<List<ThemeAdvertisementRequest>> getMyRequests() {
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.USER);
        UUID userId = AuthenticationUtil.getCurrentWebUserId();
        List<ThemeAdvertisementRequest> requests = queueService.getUserAdvertisements(userId);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/queue-status")
    public ResponseEntity<QueueStatusResponseDto> getQueueStatus() {
        List<ThemeAdvertisementRequest> activeAds = queueService.getActiveAdvertisements();
        List<ThemeAdvertisementRequest> queuedAds = queueService.getQueuedAdvertisements();
        
        return ResponseEntity.ok(new QueueStatusResponseDto(
            activeAds.size(),
            15,
            queuedAds.size(),
            calculateEstimatedWaitTime(queuedAds.size())
        ));
    }
    
    @DeleteMapping("/request/{requestId}")
    public ResponseEntity<BasicResponseDto> cancelRequest(
            @PathVariable UUID requestId) {
        try {
            // 요청 소유자 확인은 서비스에서 처리
            queueService.cancelQueuedAdvertisement(requestId);
            
            return ResponseEntity.ok(
                new BasicResponseDto(true, "광고 신청이 취소되었습니다.")
            );
            
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(
                new BasicResponseDto(false, e.getMessage())
            );
        } catch (Exception e) {
            log.error("광고 취소 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(
                new BasicResponseDto(false, "서버 오류가 발생했습니다.")
            );
        }
    }
    
    @DeleteMapping("/active/{requestId}")
    public ResponseEntity<BasicResponseDto> cancelActiveRequest(
            @PathVariable UUID requestId) {
        try {
            queueService.cancelActiveAdvertisement(requestId);
            
            return ResponseEntity.ok(
                new BasicResponseDto(true, "활성 광고가 취소되었습니다.")
            );
            
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(
                new BasicResponseDto(false, e.getMessage())
            );
        } catch (Exception e) {
            log.error("활성 광고 취소 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(
                new BasicResponseDto(false, "서버 오류가 발생했습니다.")
            );
        }
    }
    
    @PostMapping("/click/{requestId}")
    public ResponseEntity<BasicResponseDto> recordClick(@PathVariable UUID requestId) {
        queueService.recordClick(requestId);
        return ResponseEntity.ok(new BasicResponseDto(true, "클릭이 기록되었습니다."));
    }
    
    @PostMapping("/exposure/{requestId}")
    public ResponseEntity<BasicResponseDto> recordExposure(@PathVariable UUID requestId) {
        queueService.recordExposure(requestId);
        return ResponseEntity.ok(new BasicResponseDto(true, "노출이 기록되었습니다."));
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
            @RequestBody CalculateRefundDto dto) {
        try {
            UUID userId = AuthenticationUtil.getCurrentWebUserId();
            
            // 입력 검증
            if (dto.getRequestId() == null) {
                return ResponseEntity.badRequest().body(
                    new BasicResponseDto(false, "광고 요청 ID가 필요합니다.")
                );
            }
            
            // 광고 요청 조회
            ThemeAdvertisementRequest request = queueService.getAdvertisementRequestById(dto.getRequestId())
                .orElseThrow(ErrorStatus.ADVERTISEMENT_NOT_FOUND::asServiceException);
            
            // 소유권 검증
            if (!request.getUserId().equals(userId)) {
                throw ErrorStatus.FORBIDDEN.asServiceException();
            }
            
            // 환불 가능 상태 검증
            if (request.getStatus() == AdvertisementStatus.CANCELLED ||
                request.getStatus() == AdvertisementStatus.EXPIRED ||
                request.getStatus() == AdvertisementStatus.REFUNDED) {
                return ResponseEntity.badRequest().body(
                    new BasicResponseDto(false, "이미 취소되었거나 완료된 광고는 환불할 수 없습니다.")
                );
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
            
            return ResponseEntity.ok(new RefundCalculationResponseDto(
                true,
                message,
                remainingDays,
                refundAmount,
                request.getTotalCost(),
                request.getStatus().name()
            ));
            
        } catch (ServiceException e) {
            log.error("환불 계산 중 서비스 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body(
                new BasicResponseDto(false, e.getMessage())
            );
        } catch (Exception e) {
            log.error("환불 계산 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError().body(
                new BasicResponseDto(false, "서버 오류가 발생했습니다.")
            );
        }
    }
    
    @PostMapping("/admin/force-cancel/{requestId}")
    public ResponseEntity<?> forceCancelAdvertisement(
            @PathVariable UUID requestId,
            @RequestBody ForceCancelDto dto) {
        try {
            WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
            // 관리자 권한 확인
            if (currentUser.getRole().ordinal() < com.crimecat.backend.webUser.enums.UserRole.ADMIN.ordinal()) {
                return ResponseEntity.status(403).body(
                    new BasicResponseDto(false, "관리자만 강제 취소할 수 있습니다.")
                );
            }
            
            // 광고 요청 조회
            ThemeAdvertisementRequest request = queueService.getAdvertisementRequestById(requestId)
                .orElseThrow(ErrorStatus.ADVERTISEMENT_NOT_FOUND::asServiceException);
            
            // 이미 취소된 광고인지 확인
            if (request.getStatus() == AdvertisementStatus.CANCELLED ||
                request.getStatus() == AdvertisementStatus.EXPIRED ||
                request.getStatus() == AdvertisementStatus.REFUNDED) {
                return ResponseEntity.badRequest().body(
                    new BasicResponseDto(false, "이미 취소되었거나 완료된 광고입니다.")
                );
            }
            
            // 강제 취소 처리
            boolean refunded = queueService.forceCancelAdvertisement(requestId, dto.getReason(), currentUser.getId());
            
            return ResponseEntity.ok(new ForceCancelResponseDto(
                true,
                "광고가 강제 취소되었습니다.",
                refunded,
                dto.getReason()
            ));
            
        } catch (ServiceException e) {
            log.error("강제 광고 취소 중 서비스 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body(
                new BasicResponseDto(false, e.getMessage())
            );
        } catch (Exception e) {
            log.error("강제 광고 취소 중 예상치 못한 오류 발생", e);
            return ResponseEntity.internalServerError().body(
                new BasicResponseDto(false, "서버 오류가 발생했습니다.")
            );
        }
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<?> getAdvertisementStatistics(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID themeId) {
        try {
      WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
            UUID targetUserId = userId;
            
            // 권한 검증: 자신의 통계이거나 관리자인 경우만 조회 가능
            if (targetUserId != null && !targetUserId.equals(currentUser.getId())) {
                if (currentUser.getRole().ordinal() < com.crimecat.backend.webUser.enums.UserRole.ADMIN.ordinal()) {
                    return ResponseEntity.status(403).body(
                        new BasicResponseDto(false, "다른 사용자의 통계는 관리자만 조회할 수 있습니다.")
                    );
                }
            } else if (targetUserId == null) {
                // userId가 지정되지 않으면 현재 사용자의 통계
                targetUserId = currentUser.getId();
            }
            
            // 통계 조회
            Map<String, Object> statistics = queueService.getAdvertisementStatistics(targetUserId, themeId);
            
            return ResponseEntity.ok(new StatisticsResponseDto(true, statistics));
            
        } catch (Exception e) {
            log.error("광고 통계 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(
                new BasicResponseDto(false, "서버 오류가 발생했습니다.")
            );
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
        @NotNull(message = "테마 ID는 필수입니다")
        private UUID themeId;
        
        @NotBlank(message = "테마 이름은 필수입니다")
        @Size(max = 100, message = "테마 이름은 100자 이하여야 합니다")
        private String themeName;
        
        @NotNull(message = "테마 타입은 필수입니다")
        private ThemeAdvertisementRequest.ThemeType themeType;
        
        @NotNull(message = "광고 기간은 필수입니다")
        @Min(value = 1, message = "광고 기간은 최소 1일입니다")
        @Max(value = 15, message = "광고 기간은 최대 15일입니다")
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
        @NotBlank(message = "취소 사유는 필수입니다")
        @Size(max = 500, message = "취소 사유는 500자 이하여야 합니다")
        private String reason;
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
    
    // Response DTO classes
    public static class AdvertisementRequestResponseDto {
        private boolean success;
        private String message;
        private UUID requestId;
        private AdvertisementStatus status;
        private Integer queuePosition;
        
        public AdvertisementRequestResponseDto(boolean success, String message, UUID requestId, 
                                             AdvertisementStatus status, Integer queuePosition) {
            this.success = success;
            this.message = message;
            this.requestId = requestId;
            this.status = status;
            this.queuePosition = queuePosition;
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public UUID getRequestId() { return requestId; }
        public AdvertisementStatus getStatus() { return status; }
        public Integer getQueuePosition() { return queuePosition; }
    }
    
    public static class QueueStatusResponseDto {
        private int activeCount;
        private int maxActiveSlots;
        private int queuedCount;
        private String estimatedWaitTime;
        
        public QueueStatusResponseDto(int activeCount, int maxActiveSlots, int queuedCount, String estimatedWaitTime) {
            this.activeCount = activeCount;
            this.maxActiveSlots = maxActiveSlots;
            this.queuedCount = queuedCount;
            this.estimatedWaitTime = estimatedWaitTime;
        }
        
        // Getters
        public int getActiveCount() { return activeCount; }
        public int getMaxActiveSlots() { return maxActiveSlots; }
        public int getQueuedCount() { return queuedCount; }
        public String getEstimatedWaitTime() { return estimatedWaitTime; }
    }
    
    public static class BasicResponseDto {
        private boolean success;
        private String message;
        
        public BasicResponseDto(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
    
    public static class RefundCalculationResponseDto {
        private boolean success;
        private String message;
        private int remainingDays;
        private int refundAmount;
        private int originalAmount;
        private String status;
        
        public RefundCalculationResponseDto(boolean success, String message, int remainingDays,
                                          int refundAmount, int originalAmount, String status) {
            this.success = success;
            this.message = message;
            this.remainingDays = remainingDays;
            this.refundAmount = refundAmount;
            this.originalAmount = originalAmount;
            this.status = status;
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public int getRemainingDays() { return remainingDays; }
        public int getRefundAmount() { return refundAmount; }
        public int getOriginalAmount() { return originalAmount; }
        public String getStatus() { return status; }
    }
    
    public static class ForceCancelResponseDto {
        private boolean success;
        private String message;
        private boolean refunded;
        private String reason;
        
        public ForceCancelResponseDto(boolean success, String message, boolean refunded, String reason) {
            this.success = success;
            this.message = message;
            this.refunded = refunded;
            this.reason = reason;
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public boolean isRefunded() { return refunded; }
        public String getReason() { return reason; }
    }
    
    public static class StatisticsResponseDto {
        private boolean success;
        private Map<String, Object> statistics;
        
        public StatisticsResponseDto(boolean success, Map<String, Object> statistics) {
            this.success = success;
            this.statistics = statistics;
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public Map<String, Object> getStatistics() { return statistics; }
    }
}