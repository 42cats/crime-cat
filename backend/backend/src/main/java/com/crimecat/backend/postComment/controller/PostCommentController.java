package com.crimecat.backend.postComment.controller;

import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.postComment.dto.PostCommentResponse;
import com.crimecat.backend.postComment.repository.PostCommentRepository;
import com.crimecat.backend.postComment.service.PostCommentService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@RequestMapping("/api/v1/posts/comments")
@Controller
@RequiredArgsConstructor
public class PostCommentController {

    private final PostCommentService postCommentService;

    @GetMapping
    public ResponseEntity<List<PostCommentResponse>> getCommentResponses(
        @RequestParam(value = "post") UUID postId,
        @AuthenticationPrincipal WebUser currentUser
    ) {
        return ResponseEntity.ok().body(
                postCommentService.getCommentResponses(postId, currentUser.getId())
        );
    }

}
