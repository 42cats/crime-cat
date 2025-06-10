package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.dto.AdvertisementStatsResponse;
import com.crimecat.backend.advertisement.dto.PlatformAdvertisementStats;
import com.crimecat.backend.advertisement.dto.UserAdvertisementSummary;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementStatsService;
import com.crimecat.backend.auth.domain.WebUser;
import com.crimecat.backend.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/**
 * 테마 광고 통계 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/theme-advertisements/stats")
@RequiredArgsConstructor
public class ThemeAdvertisementStatsController {
    
    private final ThemeAdvertisementStatsService statsService;
    private final AuthService authService;
    
    /**
     * 현재 사용자의 광고 상세 통계 조회
     */
    @GetMapping("/my-ads")
    public ResponseEntity<List<AdvertisementStatsResponse>> getMyAdvertisementStats(Principal principal) {
        try {
            WebUser user = authService.getCurrentUser(principal);
            List<AdvertisementStatsResponse> stats = statsService.getUserAdvertisementStats(user.getId());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("사용자 광고 상세 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 현재 사용자의 광고 요약 통계
     */
    @GetMapping("/my-summary")
    public ResponseEntity<UserAdvertisementSummary> getMyAdvertisementSummary(Principal principal) {
        try {
            WebUser user = authService.getCurrentUser(principal);
            UserAdvertisementSummary summary = statsService.getUserAdvertisementSummary(user.getId());
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("사용자 광고 요약 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 특정 광고의 상세 통계 조회 (관리자 또는 광고 게시 당사자만)
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<AdvertisementStatsResponse> getAdvertisementStats(
            @PathVariable UUID requestId,
            Principal principal) {
        try {
            WebUser user = authService.getCurrentUser(principal);
            AdvertisementStatsResponse stats = statsService.getAdvertisementStats(requestId);
            
            // 관리자가 아니면서 본인의 광고가 아닌 경우 접근 거부
            boolean isAdmin = user.getRole().equals("ADMIN") || user.getRole().equals("MANAGER");
            if (!isAdmin && !statsService.isUserAdvertisement(requestId, user.getId())) {
                return ResponseEntity.status(403).build();
            }
            
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("광고 상세 통계 조회 실패: requestId={}", requestId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 플랫폼 전체 통계 조회 (공개)
     */
    @GetMapping("/platform")
    public ResponseEntity<PlatformAdvertisementStats> getPlatformStats() {
        try {
            PlatformAdvertisementStats stats = statsService.getPlatformStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("플랫폼 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}