package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.gameHistory.dto.UserProfileStatsResponse;
import com.crimecat.backend.gameHistory.service.UserProfileStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/user-profile-stats")
public class UserProfileStatsPublicController {
    
    private final UserProfileStatsService userProfileStatsService;
    
    /**
     * 특정 사용자의 프로필 통계 정보 조회 (공개)
     * 제작 테마 수, 크라임씬 플레이 수, 방탈출 플레이 수, 팔로워 수, 팔로잉 수를 한 번에 조회
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<UserProfileStatsResponse> getUserProfileStats(@PathVariable String userId) {
        log.info("사용자 프로필 통계 조회 요청 - userId: {}", userId);
        UserProfileStatsResponse response = userProfileStatsService.getUserProfileStats(userId);
        return ResponseEntity.ok(response);
    }
}