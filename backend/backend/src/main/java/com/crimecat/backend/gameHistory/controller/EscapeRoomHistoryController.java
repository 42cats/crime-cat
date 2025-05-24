package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryRequest;
import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse;
import com.crimecat.backend.gameHistory.service.EscapeRoomHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/escape-room-histories")
public class EscapeRoomHistoryController {
    
    private final EscapeRoomHistoryService escapeRoomHistoryService;
    
    /**
     * 방탈출 기록 생성
     */
    @PostMapping
    public ResponseEntity<EscapeRoomHistoryResponse> createHistory(
            @Valid @RequestBody EscapeRoomHistoryRequest request) {
        log.info("방탈출 기록 생성 요청 - themeId: {}", request.getEscapeRoomThemeId());
        EscapeRoomHistoryResponse response = escapeRoomHistoryService.createHistory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 방탈출 기록 수정
     */
    @PutMapping("/{historyId}")
    public ResponseEntity<EscapeRoomHistoryResponse> updateHistory(
            @PathVariable UUID historyId,
            @Valid @RequestBody EscapeRoomHistoryRequest request) {
        log.info("방탈출 기록 수정 요청 - historyId: {}", historyId);
        EscapeRoomHistoryResponse response = escapeRoomHistoryService.updateHistory(historyId, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 방탈출 기록 삭제
     */
    @DeleteMapping("/{historyId}")
    public ResponseEntity<Void> deleteHistory(@PathVariable UUID historyId) {
        log.info("방탈출 기록 삭제 요청 - historyId: {}", historyId);
        escapeRoomHistoryService.deleteHistory(historyId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 특정 기록 상세 조회
     */
    @GetMapping("/{historyId}")
    public ResponseEntity<EscapeRoomHistoryResponse> getHistory(@PathVariable UUID historyId) {
        log.info("방탈출 기록 조회 요청 - historyId: {}", historyId);
        EscapeRoomHistoryResponse response = escapeRoomHistoryService.getHistory(historyId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 내 방탈출 기록 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<Page<EscapeRoomHistoryResponse>> getMyHistories(
            @PageableDefault(size = 20, sort = "playDate", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("내 방탈출 기록 목록 조회 요청");
        Page<EscapeRoomHistoryResponse> response = escapeRoomHistoryService.getMyHistories(pageable);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 현재 사용자가 특정 테마를 플레이했는지 확인
     */
    @GetMapping("/theme/{themeId}/played")
    public ResponseEntity<Boolean> hasPlayedTheme(@PathVariable UUID themeId) {
        log.info("테마 플레이 여부 확인 요청 - themeId: {}", themeId);
        boolean hasPlayed = escapeRoomHistoryService.hasCurrentUserPlayedTheme(themeId);
        return ResponseEntity.ok(hasPlayed);
    }
    
}