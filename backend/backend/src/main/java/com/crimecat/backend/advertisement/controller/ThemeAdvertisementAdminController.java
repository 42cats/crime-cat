package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.dto.CreateThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.dto.ThemeAdvertisementResponse;
import com.crimecat.backend.advertisement.dto.UpdateThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.service.DiscordBotCacheService;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementQueueService;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 관리자 전용 테마 광고 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/admin/theme-ads")
@RequiredArgsConstructor
public class ThemeAdvertisementAdminController {
    
    private final ThemeAdvertisementService advertisementService;
    private final ThemeAdvertisementQueueService queueService;
    private final DiscordBotCacheService discordBotCacheService;
    
    /**
     * 모든 광고 신청 목록 조회 (관리자용)
     */
    @GetMapping
    public ResponseEntity<List<ThemeAdvertisementResponse>> getAllAdvertisements() {
        return ResponseEntity.ok(advertisementService.getAllAdvertisements());
    }
    
    /**
     * 새 광고 생성 (관리자용)
     */
    @PostMapping
    public ResponseEntity<ThemeAdvertisementResponse> createAdvertisement(
            @Valid @RequestBody CreateThemeAdvertisementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(advertisementService.createAdvertisement(request));
    }
    
    /**
     * 광고 수정 (관리자용)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ThemeAdvertisementResponse> updateAdvertisement(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateThemeAdvertisementRequest request) {
        return ResponseEntity.ok(advertisementService.updateAdvertisement(id, request));
    }
    
    /**
     * 광고 삭제 (관리자용)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdvertisement(@PathVariable UUID id) {
        advertisementService.deleteAdvertisement(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 특정 광고 강제 취소 (관리자용)
     */
    @DeleteMapping("/{requestId}/force-cancel")
    public ResponseEntity<String> forceCancelAdvertisement(@PathVariable UUID requestId) {
        try {
            // TODO: 관리자 강제 취소 로직 구현
            return ResponseEntity.ok("광고 강제 취소 완료");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("광고 강제 취소 실패: " + e.getMessage());
        }
    }
    
    /**
     * 광고 시스템 설정 조회 (관리자용)
     */
    @GetMapping("/settings")
    public ResponseEntity<?> getAdvertisementSettings() {
        return ResponseEntity.ok(Map.of(
            "maxActiveSlots", 15,
            "costPerDay", 100,
            "maxDaysPerAd", 15
        ));
    }
    
    /**
     * 디스코드 봇 캐시 강제 갱신 (관리자용)
     */
    @PostMapping("/discord-cache/force-refresh")
    public ResponseEntity<String> forceRefreshDiscordCache() {
        discordBotCacheService.updateActiveAdvertisementsCache();
        return ResponseEntity.ok("디스코드 봇 캐시 강제 갱신 완료");
    }
    
    /**
     * 광고 통계 조회 (관리자용)
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getAdvertisementStatistics() {
        // TODO: 광고 통계 로직 구현
        return ResponseEntity.ok("광고 통계 데이터");
    }
}