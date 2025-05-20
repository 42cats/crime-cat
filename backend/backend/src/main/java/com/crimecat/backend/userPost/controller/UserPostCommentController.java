package com.crimecat.backend.userPost.controller;

import org.springframework.http.ResponseEntity;
import com.crimecat.backend.userPost.dto.UserPostCommentDto;
import com.crimecat.backend.userPost.dto.UserPostCommentRequest;
import com.crimecat.backend.userPost.service.UserPostCommentService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user-posts")
@RequiredArgsConstructor
public class UserPostCommentController {

    private final UserPostCommentService userPostCommentService;

    /**
     * 댓글 작성
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<UserPostCommentDto> createComment(
            @PathVariable UUID postId,
            @Valid @RequestBody UserPostCommentRequest request) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UserPostCommentDto createdComment = userPostCommentService.createComment(postId, currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComment);
    }

    /**
     * 댓글 수정
     */
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<UserPostCommentDto> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody UserPostCommentRequest request) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UserPostCommentDto updatedComment = userPostCommentService.updateComment(commentId, currentUser, request);
        return ResponseEntity.ok(updatedComment);
    }

    /**
     * 댓글 삭제
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        userPostCommentService.deleteComment(commentId, currentUser);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글의 댓글 목록 조회
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<Page<UserPostCommentDto>> getCommentsByPostId(
            @PathVariable UUID postId,
            @PageableDefault(size = 20) Pageable pageable) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        Page<UserPostCommentDto> comments = userPostCommentService.getCommentsByPostId(postId, currentUser, pageable);
        return ResponseEntity.ok(comments);
    }

    /**
     * 특정 댓글의 답글 목록 조회
     */
    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<List<UserPostCommentDto>> getRepliesByCommentId(@PathVariable UUID commentId) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        List<UserPostCommentDto> replies = userPostCommentService.getRepliesByCommentId(commentId, currentUser);
        return ResponseEntity.ok(replies);
    }
}
