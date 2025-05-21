package com.crimecat.backend.hashtag.controller;

import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.hashtag.domain.HashTag;
import com.crimecat.backend.hashtag.dto.HashTagDto;
import com.crimecat.backend.hashtag.service.HashTagService;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.webUser.domain.WebUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "해시태그 API", description = "해시태그 관련 API")
public class HashTagController {

    private final HashTagService hashTagService;
    private final UserPostService userPostService;

    @GetMapping
    @Operation(summary = "인기 해시태그 목록 조회", description = "가장 많이 사용된 해시태그 목록을 조회합니다.")
    public ResponseEntity<PageResponseDto<HashTagDto>> getPopularHashTags(
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<HashTag> hashTags = hashTagService.getPopularHashTags(pageable);
        
        Page<HashTagDto> dtoPage = hashTags.map(hashTag -> HashTagDto.builder()
                .id(hashTag.getId())
                .name(hashTag.getName())
                .useCount(hashTag.getUseCount())
                .build());
        
        return ResponseEntity.ok(new PageResponseDto<>(dtoPage));
    }

    @GetMapping("/search")
    @Operation(summary = "해시태그 검색", description = "해시태그를 검색합니다. (자동완성)")
    public ResponseEntity<PageResponseDto<HashTagDto>> searchHashTags(
            @RequestParam String query,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Page<HashTag> hashTags = hashTagService.searchHashTagsByName(query, pageable);
        
        Page<HashTagDto> dtoPage = hashTags.map(hashTag -> HashTagDto.builder()
                .id(hashTag.getId())
                .name(hashTag.getName())
                .useCount(hashTag.getUseCount())
                .build());
        
        return ResponseEntity.ok(new PageResponseDto<>(dtoPage));
    }

    @GetMapping("/{tagName}/posts")
    @Operation(summary = "해시태그로 게시물 검색", description = "특정 해시태그가 포함된 게시물을 검색합니다.")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getPostsByHashTag(
            @PathVariable String tagName,
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getPostsByHashTag(tagName, currentUser, pageable);
        
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/posts")
    @Operation(summary = "여러 해시태그로 게시물 검색", description = "여러 해시태그가 모두 포함된 게시물을 검색합니다. (AND 조건)")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getPostsByMultipleHashTags(
            @RequestParam List<String> tags,
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getPostsByAllHashTags(tags, currentUser, pageable);
        
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }
}
