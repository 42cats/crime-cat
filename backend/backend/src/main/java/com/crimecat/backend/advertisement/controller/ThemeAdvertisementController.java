package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.service.ThemeAdvertisementQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * 프론트엔드 전용 테마 광고 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/theme-ads")
@RequiredArgsConstructor
public class ThemeAdvertisementController {
    
    private final ThemeAdvertisementQueueService queueService;
    
    /**
     * 내 광고 신청 목록 조회
     */
    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRequests() {
        // TODO: 현재 사용자의 광고 신청 목록 조회 구현
        // Authentication에서 userId 추출 후 queueService.getUserAdvertisements(userId) 호출
        return ResponseEntity.ok("내 광고 신청 목록");
    }
    
    /**
     * 큐 상태 조회
     */
    @GetMapping("/queue-status")
    public ResponseEntity<?> getQueueStatus() {
        long activeCount = queueService.getActiveAdvertisements().size();
        long queuedCount = queueService.getQueuedAdvertisements().size();
        
        return ResponseEntity.ok(Map.of(
            "activeCount", activeCount,
            "maxActiveSlots", 15,
            "queuedCount", queuedCount,
            "estimatedWaitTime", queuedCount > 0 ? "약 " + queuedCount + "-" + (queuedCount * 2) + "일" : "즉시 시작"
        ));
    }
    
    /**
     * 광고 신청
     */
    @PostMapping("/request")
    public ResponseEntity<?> requestAdvertisement(@RequestBody Map<String, Object> request) {
        try {
            // TODO: 광고 신청 로직 구현
            // Authentication에서 userId 추출 후 queueService.requestAdvertisement() 호출
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "광고 신청이 완료되었습니다.",
                "requestId", UUID.randomUUID().toString(),
                "status", "PENDING_QUEUE"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * 대기열 광고 취소
     */
    @DeleteMapping("/request/{requestId}")
    public ResponseEntity<?> cancelQueuedAdvertisement(@PathVariable UUID requestId) {
        try {
            queueService.cancelQueuedAdvertisement(requestId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "대기열 광고가 취소되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * 활성 광고 취소
     */
    @DeleteMapping("/active/{requestId}")
    public ResponseEntity<?> cancelActiveAdvertisement(@PathVariable UUID requestId) {
        try {
            queueService.cancelActiveAdvertisement(requestId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "활성 광고가 취소되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * 환불 금액 계산 (미리보기)
     */
    @PostMapping("/calculate-refund")
    public ResponseEntity<?> calculateRefund(@RequestBody Map<String, String> request) {
        try {
            String requestId = request.get("requestId");
            // TODO: 환불 금액 계산 로직 구현
            return ResponseEntity.ok(Map.of(
                "remainingDays", 5,
                "refundAmount", 500,
                "message", "5일 남아 500포인트가 환불됩니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * 광고 클릭 추적 (공개 API - 로그인 불필요)
     */
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
}