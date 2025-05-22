package com.crimecat.backend.hashtag.controller;

import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.hashtag.domain.HashTag;
import com.crimecat.backend.hashtag.dto.HashTagDto;
import com.crimecat.backend.hashtag.service.HashTagService;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/hashtags")
@RequiredArgsConstructor
public class HashTagController {

    private final UserPostService userPostService;

    @GetMapping("/{tagName}/posts")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getPostsByHashTag(
            @PathVariable String tagName,
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getPostsByHashTag(tagName, currentUser, pageable);
        
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/posts")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getPostsByMultipleHashTags(
            @RequestParam List<String> tags,
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getPostsByAllHashTags(tags, currentUser, pageable);
        
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }
}
