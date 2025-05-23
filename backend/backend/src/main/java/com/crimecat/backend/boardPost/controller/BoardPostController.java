package com.crimecat.backend.boardPost.controller;

import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.dto.BoardPostRequest;
import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.dto.PostCommentResponse;
import com.crimecat.backend.boardPost.service.BoardPostService;
import com.crimecat.backend.boardPost.service.PostCommentService;
import com.crimecat.backend.comment.dto.CommentResponse;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/v1/posts")
public class BoardPostController {

    private final BoardPostService boardPostService;
    private final PostCommentService postCommentService;

    @GetMapping("/{id}")
    public ResponseEntity<BoardPostDetailResponse> getPostDetail(
            @PathVariable("id") UUID postId,
            @AuthenticationPrincipal WebUser currentUser
    ) {
        return ResponseEntity.ok().body(
                boardPostService.getBoardPostDetail(postId, currentUser.getId())
        );
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<PostCommentResponse>> getCommentResponses(
            @PathVariable("id") UUID postId,
            @AuthenticationPrincipal WebUser currentUser
    ) {
        return ResponseEntity.ok().body(
                postCommentService.getCommentResponses(postId, currentUser.getId())
        );
    }

    @PostMapping
    public ResponseEntity<BoardPostDetailResponse> createBoardPost(
            @RequestBody @Valid BoardPostRequest request,
            @AuthenticationPrincipal WebUser currentUser
    ) {
        BoardPostDetailResponse response = boardPostService.createBoardPost(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}