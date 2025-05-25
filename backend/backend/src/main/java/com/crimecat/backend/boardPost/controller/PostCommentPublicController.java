package com.crimecat.backend.boardPost.controller;

import com.crimecat.backend.boardPost.dto.PostCommentRequest;
import com.crimecat.backend.boardPost.dto.PostCommentResponse;
import com.crimecat.backend.boardPost.service.PostCommentService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/v1/public/post_comments")
public class PostCommentPublicController {

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
}
