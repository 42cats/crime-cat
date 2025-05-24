package com.crimecat.backend.comment.controller;

import com.crimecat.backend.comment.dto.EscapeRoomCommentCreateDto;
import com.crimecat.backend.comment.dto.EscapeRoomCommentResponseDto;
import com.crimecat.backend.comment.dto.EscapeRoomCommentUpdateDto;
import com.crimecat.backend.comment.service.EscapeRoomCommentService;
import com.crimecat.backend.common.dto.PageResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/escape-room-comments")
@RequiredArgsConstructor
public class EscapeRoomCommentController {
    
    private final EscapeRoomCommentService escapeRoomCommentService;
    
    /**
     * 방탈출 댓글 작성
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EscapeRoomCommentResponseDto> createComment(
            @Valid @RequestBody EscapeRoomCommentCreateDto dto) {
        log.info("방탈출 댓글 작성 요청 - themeId: {}, hasSpoiler: {}", 
                dto.getEscapeRoomThemeId(), dto.getHasSpoiler());
        EscapeRoomCommentResponseDto response = escapeRoomCommentService.createComment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 테마별 댓글 목록 조회
     */
    @GetMapping("/theme/{themeId}")
    public ResponseEntity<PageResponseDto<EscapeRoomCommentResponseDto>> getCommentsByTheme(
            @PathVariable UUID themeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("테마별 댓글 목록 조회 - themeId: {}, page: {}, size: {}", 
                themeId, pageable.getPageNumber(), pageable.getPageSize());
        Page<EscapeRoomCommentResponseDto> comments = escapeRoomCommentService.getCommentsByTheme(themeId, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(comments));
    }
    
    /**
     * 댓글 수정
     */
    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EscapeRoomCommentResponseDto> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody EscapeRoomCommentUpdateDto dto) {
        log.info("댓글 수정 요청 - commentId: {}", commentId);
        EscapeRoomCommentResponseDto response = escapeRoomCommentService.updateComment(commentId, dto);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 댓글 삭제
     */
    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID commentId) {
        log.info("댓글 삭제 요청 - commentId: {}", commentId);
        escapeRoomCommentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 댓글 상세 조회
     */
    @GetMapping("/{commentId}")
    public ResponseEntity<EscapeRoomCommentResponseDto> getComment(
            @PathVariable UUID commentId) {
        log.info("댓글 상세 조회 - commentId: {}", commentId);
        EscapeRoomCommentResponseDto response = escapeRoomCommentService.getComment(commentId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 사용자별 댓글 목록 조회
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<PageResponseDto<EscapeRoomCommentResponseDto>> getCommentsByUser(
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("사용자별 댓글 목록 조회 - userId: {}, page: {}, size: {}", 
                userId, pageable.getPageNumber(), pageable.getPageSize());
        Page<EscapeRoomCommentResponseDto> comments = escapeRoomCommentService.getCommentsByUser(userId, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(comments));
    }
    
    /**
     * 테마 댓글 통계 조회
     */
    @GetMapping("/theme/{themeId}/stats")
    public ResponseEntity<EscapeRoomCommentService.EscapeRoomCommentStatsDto> getCommentStats(
            @PathVariable UUID themeId) {
        log.info("테마 댓글 통계 조회 - themeId: {}", themeId);
        EscapeRoomCommentService.EscapeRoomCommentStatsDto stats = escapeRoomCommentService.getCommentStats(themeId);
        return ResponseEntity.ok(stats);
    }
}