package com.crimecat.backend.userPost.controller.explore;

import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.utils.AuthenticationUtil;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExploreController {

    private final UserPostService userPostService;

    @GetMapping("/public/posts/explore/popular")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getPopularPosts(
            @PageableDefault(size = 20) Pageable pageable) {

        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        Page<UserPostGalleryPageDto> posts = userPostService.getPopularPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/public/posts/explore/random")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getRandomPosts(
            @PageableDefault(size = 20) Pageable pageable) {

        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        Page<UserPostGalleryPageDto> posts = userPostService.getRandomPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/public/posts/explore/search")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> searchPosts(
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        
        // 통합 검색: 제목 + 태그 + 작성자 이름으로 검색
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        Page<UserPostGalleryPageDto> posts = userPostService.searchPostsWithAuthor(query, currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }
    
    @GetMapping("/public/posts/feed")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getFeedPosts(
            @PageableDefault(size = 10) Pageable pageable) {
        
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        Page<UserPostGalleryPageDto> posts = userPostService.getFeedPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

}
