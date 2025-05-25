package com.crimecat.backend.comment.controller;

import com.crimecat.backend.comment.dto.EscapeRoomCommentResponseDto;
import com.crimecat.backend.comment.service.EscapeRoomCommentService;
import com.crimecat.backend.comment.sort.CommentSortType;
import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "LATEST") CommentSortType sortType,
            @RequestParam(required = false) Boolean spoilerOnly) {
        
        log.info("테마별 댓글 목록 조회 - themeId: {}, page: {}, size: {}, sortType: {}, spoilerOnly: {}", 
                themeId, page, size, sortType, spoilerOnly);
        
        // 현재 사용자 정보 조회 (선택적)
        WebUser webUser = AuthenticationUtil.getCurrentWebUserOptional()
            .orElse(null);
        UUID currentWebUserId = (webUser != null) ? webUser.getId() : null;
        
        // Pageable 생성 with CommentSortType
        Pageable pageable = PageRequest.of(page, size, sortType.getSort());
        
        Page<EscapeRoomCommentResponseDto> comments = escapeRoomCommentService.getCommentsByTheme(
            themeId, 
            currentWebUserId, 
            pageable,
            spoilerOnly
        );
        
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