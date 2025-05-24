package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse;
import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryStatsResponse;
import com.crimecat.backend.gameHistory.service.EscapeRoomHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/escape-room-histories")
public class EscapeRoomHistoryPublicController {
    
    private final EscapeRoomHistoryService escapeRoomHistoryService;
    
    /**
     * 특정 테마의 공개 기록 목록 조회 (공개)
     */
    @GetMapping("/theme/{themeId}")
    public ResponseEntity<Page<EscapeRoomHistoryResponse>> getThemeHistories(
            @PathVariable UUID themeId,
            @PageableDefault(size = 20, sort = "playDate", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("테마별 방탈출 기록 목록 조회 요청 - themeId: {}", themeId);
        Page<EscapeRoomHistoryResponse> response = escapeRoomHistoryService.getThemeHistories(themeId, pageable);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 최근 방탈출 기록 조회 (홈 화면용, 공개)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<EscapeRoomHistoryResponse>> getRecentHistories(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("최근 방탈출 기록 조회 요청 - limit: {}", limit);
        List<EscapeRoomHistoryResponse> response = escapeRoomHistoryService.getRecentHistories(limit);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 특정 테마의 통계 정보 조회 (공개)
     */
    @GetMapping("/theme/{themeId}/statistics")
    public ResponseEntity<EscapeRoomHistoryStatsResponse> getThemeStatistics(@PathVariable UUID themeId) {
        log.info("테마 통계 정보 조회 요청 - themeId: {}", themeId);
        EscapeRoomHistoryStatsResponse response = escapeRoomHistoryService.getThemeStatistics(themeId);
        return ResponseEntity.ok(response);
    }
}