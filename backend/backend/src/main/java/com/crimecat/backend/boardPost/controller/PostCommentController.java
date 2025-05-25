package com.crimecat.backend.boardPost.controller;

import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.dto.PostCommentRequest;
import com.crimecat.backend.boardPost.dto.PostCommentResponse;
import com.crimecat.backend.boardPost.service.BoardPostService;
import com.crimecat.backend.boardPost.service.PostCommentService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/v1/post_comments")
public class PostCommentController {

    private final PostCommentService postCommentService;

    @GetMapping("/{id}")
    public ResponseEntity<Page<PostCommentResponse>> getCommentResponses(
            @PathVariable("id") UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "LATEST") String sortType
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUserOptional()
            .orElse(null);
        UUID currentWebUserId = (currentWebUser != null) ? currentWebUser.getId() : null;
        
        return ResponseEntity.ok().body(
                postCommentService.getCommentResponsesPage(postId, currentWebUserId, page, size)
        );
    }

    @PostMapping("{id}")
    public ResponseEntity<PostCommentResponse> createComment(
            @PathVariable("id") UUID postId,
            @RequestBody @Valid PostCommentRequest postCommentRequest
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        PostCommentResponse response = postCommentService.createPostComment(postId, currentWebUser, postCommentRequest);
        return ResponseEntity.ok().body(response);
    }

    @PutMapping("{id}")
    public ResponseEntity<PostCommentResponse> updateComment(
            @PathVariable("id") UUID commentId,
            @RequestBody @Valid PostCommentRequest postCommentRequest
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        PostCommentResponse response = postCommentService.updatePostComment(commentId, currentWebUser.getId(), postCommentRequest);
        return ResponseEntity.ok().body(response);
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable("id") UUID commentId
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        postCommentService.deletePostComment(commentId, currentWebUser.getId());
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("{id}/like")
    public ResponseEntity<Void> toggleCommentLike(
            @PathVariable("id") UUID commentId
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        postCommentService.toggleCommentLike(commentId, currentWebUser.getId());
        return ResponseEntity.ok().build();
    }
}
