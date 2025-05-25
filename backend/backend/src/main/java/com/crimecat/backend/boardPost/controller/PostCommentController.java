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
    public ResponseEntity<List<PostCommentResponse>> getCommentResponses(
            @PathVariable("id") UUID postId
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        return ResponseEntity.ok().body(
                postCommentService.getCommentResponses(postId, currentWebUser.getId())
        );
    }

    @PostMapping("{id}")
    public ResponseEntity<List<PostCommentResponse>> createComment(
            @PathVariable("id") UUID postId,
            @RequestBody @Valid PostCommentRequest postCommentRequest
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        return ResponseEntity.ok().body(
                postCommentService.createPostComment(postId, currentWebUser, postCommentRequest)
        );
    }

    @PutMapping("{id}")
    public ResponseEntity<List<PostCommentResponse>> updateComment(
            @PathVariable("id") UUID commentId,
            @RequestBody @Valid PostCommentRequest postCommentRequest
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        return ResponseEntity.ok().body(
                postCommentService.updatePostComment(commentId, currentWebUser.getId(), postCommentRequest)
        );
    }

    @DeleteMapping("{id}")
    public ResponseEntity<List<PostCommentResponse>> deleteComment(
            @PathVariable("id") UUID commentId
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        return ResponseEntity.ok().body(
                postCommentService.deletePostComment(commentId, currentWebUser.getId())
        );
    }
}
