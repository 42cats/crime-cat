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

@RestController
@RequestMapping("/api/v1/public/hashtags")
@RequiredArgsConstructor
public class PublicHashTagController {

    private final HashTagService hashTagService;

    @GetMapping("/popular")
    public ResponseEntity<PageResponseDto<HashTagDto>> getPopularHashTags(
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<HashTag> hashTags = hashTagService.getPopularHashTags(pageable);
        
        Page<HashTagDto> dtoPage = hashTags.map(hashTag -> HashTagDto.builder()
                .id(hashTag.getId())
                .name(hashTag.getName())
                .useCount(hashTag.getUseCount())
                .lastUsedAt(hashTag.getLastUsedAt())
                .build());
        
        return ResponseEntity.ok(new PageResponseDto<>(dtoPage));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponseDto<HashTagDto>> searchHashTags(
            @RequestParam String query,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Page<HashTag> hashTags = hashTagService.searchHashTagsByName(query, pageable);
        
        Page<HashTagDto> dtoPage = hashTags.map(hashTag -> HashTagDto.builder()
                .id(hashTag.getId())
                .name(hashTag.getName())
                .useCount(hashTag.getUseCount())
                .lastUsedAt(hashTag.getLastUsedAt())
                .build());
        
        return ResponseEntity.ok(new PageResponseDto<>(dtoPage));
    }
}
