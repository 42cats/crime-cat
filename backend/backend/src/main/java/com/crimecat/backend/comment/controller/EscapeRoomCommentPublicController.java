package com.crimecat.backend.comment.controller;

import com.crimecat.backend.comment.dto.EscapeRoomCommentResponseDto;
import com.crimecat.backend.comment.service.EscapeRoomCommentService;
import com.crimecat.backend.common.dto.PageResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/public/escape-room-comments")
@RequiredArgsConstructor
public class EscapeRoomCommentPublicController {
    
    private final EscapeRoomCommentService escapeRoomCommentService;
    
    /**
     * 테마별 댓글 목록 조회 (공개)
     */
    @GetMapping("/theme/{themeId}")
    public ResponseEntity<PageResponseDto<EscapeRoomCommentResponseDto>> getCommentsByTheme(
            @PathVariable UUID themeId,
            @RequestParam(required = false) Boolean spoilerOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("테마별 댓글 목록 조회 - themeId: {}, spoilerOnly: {}, page: {}, size: {}", 
                themeId, spoilerOnly, pageable.getPageNumber(), pageable.getPageSize());
        Page<EscapeRoomCommentResponseDto> comments = escapeRoomCommentService.getCommentsByTheme(themeId, pageable);
        
        // 스포일러 필터링
        if (spoilerOnly != null) {
            comments = comments.map(c -> c);  // Service에서 처리하도록 수정 필요
        }
        
        return ResponseEntity.ok(new PageResponseDto<>(comments));
    }
    
    /**
     * 댓글 상세 조회 (공개)
     */
    @GetMapping("/{commentId}")
    public ResponseEntity<EscapeRoomCommentResponseDto> getComment(
            @PathVariable UUID commentId) {
        log.info("댓글 상세 조회 - commentId: {}", commentId);
        EscapeRoomCommentResponseDto response = escapeRoomCommentService.getComment(commentId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 테마 댓글 통계 조회 (공개)
     */
    @GetMapping("/theme/{themeId}/stats")
    public ResponseEntity<EscapeRoomCommentService.EscapeRoomCommentStatsDto> getCommentStats(
            @PathVariable UUID themeId) {
        log.info("테마 댓글 통계 조회 - themeId: {}", themeId);
        EscapeRoomCommentService.EscapeRoomCommentStatsDto stats = escapeRoomCommentService.getCommentStats(themeId);
        return ResponseEntity.ok(stats);
    }
}