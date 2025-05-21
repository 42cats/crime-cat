package com.crimecat.backend.userPost.controller.explore;

import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.webUser.domain.WebUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/posts/explore")
@RequiredArgsConstructor
@Tag(name = "게시물 탐색 API", description = "인기 및 무작위 게시물 탐색 API")
public class ExploreController {

    private final UserPostService userPostService;

    @GetMapping("/popular")
    @Operation(summary = "인기 게시물 조회", description = "인기도 점수 기준으로 정렬된 게시물을 조회합니다.")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getPopularPosts(
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getPopularPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/random")
    @Operation(summary = "무작위 게시물 조회", description = "무작위로 게시물을 조회합니다.")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getRandomPosts(
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getRandomPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }
}
