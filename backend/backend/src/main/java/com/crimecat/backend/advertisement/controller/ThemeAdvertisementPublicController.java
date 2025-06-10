package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.service.ThemeAdvertisementQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * 비로그인 사용자도 접근 가능한 테마 광고 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/public/theme-ads")
@RequiredArgsConstructor
public class ThemeAdvertisementPublicController {
    
    private final ThemeAdvertisementQueueService queueService;
    
    /**
     * 활성 광고 목록 조회 (공개)
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveAdvertisements() {
        return ResponseEntity.ok(queueService.getActiveAdvertisements());
    }
    
    /**
     * 큐 상태 조회 (공개)
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
     * 광고 클릭 기록 (공개 - 웹사이트에서 광고 클릭 시)
     */
    @PostMapping("/click/{requestId}")
    public ResponseEntity<String> recordClick(@PathVariable UUID requestId) {
        try {
            queueService.recordClick(requestId);
            return ResponseEntity.ok("클릭 기록 완료");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("클릭 기록 실패: " + e.getMessage());
        }
    }
}