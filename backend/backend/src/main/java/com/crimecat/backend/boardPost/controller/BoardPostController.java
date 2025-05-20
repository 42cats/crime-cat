package com.crimecat.backend.boardPost.controller;

import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.service.BoardPostService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/posts")
public class BoardPostController {

    private final BoardPostService boardPostService;

    @GetMapping("/{id}")
    public ResponseEntity<BoardPostDetailResponse> getPostDetail(
            @PathVariable("id") UUID postId,
            @AuthenticationPrincipal WebUser currentUser
    ) {
        BoardPostDetailResponse boardPostDetailResponse = boardPostService.getBoardPostDetail(postId, currentUser.getId());
        return ResponseEntity.ok().body(boardPostDetailResponse);
    }
}
