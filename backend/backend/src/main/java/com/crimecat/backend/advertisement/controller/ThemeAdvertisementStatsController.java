package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.dto.AdvertisementStatsResponse;
import com.crimecat.backend.advertisement.dto.PlatformAdvertisementStats;
import com.crimecat.backend.advertisement.dto.UserAdvertisementSummary;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementStatsService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    
    /**
     * 현재 사용자의 광고 상세 통계 조회
     */
    @GetMapping("/my-ads")
    public ResponseEntity<List<AdvertisementStatsResponse>> getMyAdvertisementStats() {
        try {
            WebUser user = AuthenticationUtil.getCurrentWebUser();
            List<AdvertisementStatsResponse> stats = statsService.getUserAdvertisementStats(user.getId());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("사용자 광고 상세 통계 조회 실패", e);
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
        }
    }
    
    /**
     * 현재 사용자의 광고 요약 통계
     */
    @GetMapping("/my-summary")
    public ResponseEntity<UserAdvertisementSummary> getMyAdvertisementSummary() {
        try {
            WebUser user = AuthenticationUtil.getCurrentWebUser();
            UserAdvertisementSummary summary = statsService.getUserAdvertisementSummary(user.getId());
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("사용자 광고 요약 통계 조회 실패", e);
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
        }
    }
    
    /**
     * 특정 광고의 상세 통계 조회 (관리자 또는 광고 게시 당사자만)
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<AdvertisementStatsResponse> getAdvertisementStats(@PathVariable UUID requestId) {
        try {
            WebUser user = AuthenticationUtil.getCurrentWebUser();
            AdvertisementStatsResponse stats = statsService.getAdvertisementStats(requestId);
            
            // 관리자가 아니면서 본인의 광고가 아닌 경우 접근 거부
            boolean isAdmin = user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.MANAGER;
            if (!isAdmin && !statsService.isUserAdvertisement(requestId, user.getId())) {
                throw ErrorStatus.FORBIDDEN.asControllerException();
            }
            
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            throw ErrorStatus.ADVERTISEMENT_NOT_FOUND.asControllerException();
        } catch (Exception e) {
            log.error("광고 상세 통계 조회 실패: requestId={}", requestId, e);
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
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
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
        }
    }
}