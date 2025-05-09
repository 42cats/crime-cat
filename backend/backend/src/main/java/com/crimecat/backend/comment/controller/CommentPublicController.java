package com.crimecat.backend.comment.controller;

import com.crimecat.backend.comment.dto.CommentResponse;
import com.crimecat.backend.comment.service.CommentService;
import com.crimecat.backend.comment.sort.CommentSortType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/gamethemes/{gameThemeId}/comments")
@RequiredArgsConstructor
public class CommentPublicController {
    private final CommentService commentService;
    
    // 공개 댓글 목록 조회 (정렬 옵션 적용) - 로그인하지 않은 사용자도 접근 가능
    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getPublicComments(
            @PathVariable UUID gameThemeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "LATEST") CommentSortType sortType) {
        
        // null을 userId로 전달하여 비로그인 사용자임을 표시
        Page<CommentResponse> comments = commentService.getPublicComments(gameThemeId, page, size, sortType);
        return ResponseEntity.ok(comments);
    }
}
