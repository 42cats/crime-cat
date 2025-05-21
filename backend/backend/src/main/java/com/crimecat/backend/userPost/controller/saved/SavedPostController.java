package com.crimecat.backend.userPost.controller.saved;

import com.crimecat.backend.common.dto.MessageResponseDto;
import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.userPost.dto.SavedPostRequestDto;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts/saved")
@RequiredArgsConstructor
public class SavedPostController {

    private final UserPostService userPostService;

    @PostMapping("/{postId}")
    public ResponseEntity<MessageResponseDto> toggleSavePost(
            @PathVariable UUID postId,
            @RequestBody(required = false) SavedPostRequestDto requestDto,
            @AuthenticationPrincipal WebUser currentUser) {
        
        String collectionName = requestDto != null ? requestDto.getCollectionName() : null;
        boolean saved = userPostService.toggleSavePost(postId, currentUser, collectionName);
        
        String message = saved ? "게시물이 저장되었습니다." : "게시물 저장이 취소되었습니다.";
        return ResponseEntity.ok(new MessageResponseDto(message));
    }

    @GetMapping("/status/{postId}")
    public ResponseEntity<Boolean> isPostSaved(
            @PathVariable UUID postId,
            @AuthenticationPrincipal WebUser currentUser) {
        
        boolean saved = userPostService.isPostSaved(postId, currentUser);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getSavedPosts(
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getSavedPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/collections")
    public ResponseEntity<List<String>> getUserCollections(
            @AuthenticationPrincipal WebUser currentUser) {
        
        List<String> collections = userPostService.getUserCollections(currentUser);
        return ResponseEntity.ok(collections);
    }

    @GetMapping("/collections/{collectionName}")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getSavedPostsByCollection(
            @PathVariable String collectionName,
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getSavedPostsByCollection(currentUser, collectionName, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }
}
