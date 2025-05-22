package com.crimecat.backend.userPost.controller.explore;

import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/posts/explore")
@RequiredArgsConstructor
public class ExploreController {

    private final UserPostService userPostService;

    @GetMapping("/popular")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getPopularPosts(
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getPopularPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/random")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getRandomPosts(
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getRandomPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> searchPosts(
            @RequestParam String query,
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.searchPosts(query, currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }
}
