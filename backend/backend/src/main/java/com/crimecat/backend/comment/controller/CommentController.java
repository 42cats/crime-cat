package com.crimecat.backend.comment.controller;

import com.crimecat.backend.comment.dto.CommentRequest;
import com.crimecat.backend.comment.dto.CommentResponse;
import com.crimecat.backend.comment.service.CommentService;
import com.crimecat.backend.comment.sort.CommentSortType;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gamethemes/{gameThemeId}/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;
    
    // 댓글 작성
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable UUID gameThemeId,
            @RequestBody @Valid CommentRequest request,
            @AuthenticationPrincipal WebUser currentUser) {
        
        CommentResponse response = commentService.createComment(gameThemeId, currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    // 댓글 수정
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable UUID gameThemeId,
            @PathVariable UUID commentId,
            @RequestBody @Valid CommentRequest request,
            @AuthenticationPrincipal WebUser currentUser) {
        
        CommentResponse response = commentService.updateComment(commentId, currentUser.getId(), request);
        return ResponseEntity.ok(response);
    }
    
    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID gameThemeId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal WebUser currentUser) {
        
        commentService.deleteComment(commentId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
    
    // 댓글 목록 조회 (정렬 옵션 적용)
    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable UUID gameThemeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "LATEST") CommentSortType sortType,
            @AuthenticationPrincipal WebUser currentUser) {
        
        Page<CommentResponse> comments = commentService.getComments(gameThemeId, currentUser.getId(), page, size, sortType);
        return ResponseEntity.ok(comments);
    }
    
    // 댓글 좋아요
    @PostMapping("/{commentId}/like")
    public ResponseEntity<Void> likeComment(
            @PathVariable UUID gameThemeId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal WebUser currentUser) {
        
        commentService.likeComment(commentId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
    
    // 댓글 좋아요 취소
    @DeleteMapping("/{commentId}/like")
    public ResponseEntity<Void> unlikeComment(
            @PathVariable UUID gameThemeId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal WebUser currentUser) {
        
        commentService.unlikeComment(commentId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
