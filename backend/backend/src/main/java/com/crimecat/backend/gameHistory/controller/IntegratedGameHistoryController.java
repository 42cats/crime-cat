package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.gameHistory.dto.integrated.GameComparisonRequest;
import com.crimecat.backend.gameHistory.dto.integrated.GameComparisonResponse;
import com.crimecat.backend.gameHistory.dto.integrated.IntegratedGameHistoryFilterRequest;
import com.crimecat.backend.gameHistory.dto.integrated.IntegratedGameHistoryResponse;
import com.crimecat.backend.gameHistory.service.IntegratedGameHistoryService;
import com.crimecat.backend.utils.AuthenticationUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 통합 게임 기록 컨트롤러
 * 모든 게임 타입의 기록을 통합하여 제공
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/game-histories")
public class IntegratedGameHistoryController {
    
    private final IntegratedGameHistoryService integratedGameHistoryService;
    
    /**
     * 사용자의 통합 게임 기록 조회
     * 한 번의 요청으로 모든 게임 타입의 기록과 통계를 조회
     */
    @GetMapping("/user/{userId}/integrated")
    public ResponseEntity<IntegratedGameHistoryResponse> getUserGameHistories(
            @PathVariable UUID userId,
            @ModelAttribute @Valid IntegratedGameHistoryFilterRequest filter) {
        
        log.info("통합 게임 기록 조회 요청 - userId: {}, filter: {}", userId, filter);
        AuthenticationUtil.validateAdminOrSameUser(userId);
        IntegratedGameHistoryResponse response = integratedGameHistoryService.getUserGameHistories(userId.toString(), filter);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 게임 기록 비교
     * 여러 사용자가 공통으로 플레이하지 않은 테마 찾기
     */
    @PostMapping("/compare")
    public ResponseEntity<GameComparisonResponse> compareGameHistories(
            @RequestBody @Valid GameComparisonRequest request) {
        
        log.info("게임 기록 비교 요청 - userIds: {}, gameType: {}", 
                request.getUserIds(), request.getGameType());
        
        GameComparisonResponse response = integratedGameHistoryService.compareGameHistories(request);
        
        return ResponseEntity.ok(response);
    }
}
