package com.crimecat.backend.userPost.controller;

import com.crimecat.backend.userPost.dto.UserPostDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.service.UserPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/user-posts")
public class PublicUserPostController {

    private final UserPostService userPostService;

    @GetMapping("/{postId}")
    public ResponseEntity<UserPostDto> getUserPost(@PathVariable UUID postId) {
        return ResponseEntity.ok(userPostService.getUserPostDetail(postId));
    }

    @GetMapping("/gallery")
    public ResponseEntity<Page<UserPostGalleryPageDto>> getUserPostGalleryPage(
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<UserPostGalleryPageDto> page = userPostService.getUserPostGalleryPage(pageable);
        return ResponseEntity.ok(page);
    }
}
