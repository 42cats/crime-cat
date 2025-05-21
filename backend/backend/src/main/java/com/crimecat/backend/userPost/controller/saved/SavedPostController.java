package com.crimecat.backend.userPost.controller.saved;

import com.crimecat.backend.common.dto.MessageResponseDto;
import com.crimecat.backend.common.dto.PageResponseDto;
import com.crimecat.backend.userPost.dto.SavedPostRequestDto;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts/saved")
@RequiredArgsConstructor
@Tag(name = "저장된 게시물 API", description = "저장된 게시물 관련 API")
public class SavedPostController {

    private final UserPostService userPostService;

    @PostMapping("/{postId}")
    @Operation(summary = "게시물 저장/취소", description = "게시물을 저장하거나 저장을 취소합니다.")
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
    @Operation(summary = "게시물 저장 상태 확인", description = "게시물의 저장 상태를 확인합니다.")
    public ResponseEntity<Boolean> isPostSaved(
            @PathVariable UUID postId,
            @AuthenticationPrincipal WebUser currentUser) {
        
        boolean saved = userPostService.isPostSaved(postId, currentUser);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    @Operation(summary = "저장된 게시물 목록 조회", description = "로그인한 사용자의 저장된 게시물 목록을 조회합니다.")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getSavedPosts(
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getSavedPosts(currentUser, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }

    @GetMapping("/collections")
    @Operation(summary = "저장 컬렉션 목록 조회", description = "로그인한 사용자의 저장 컬렉션 목록을 조회합니다.")
    public ResponseEntity<List<String>> getUserCollections(
            @AuthenticationPrincipal WebUser currentUser) {
        
        List<String> collections = userPostService.getUserCollections(currentUser);
        return ResponseEntity.ok(collections);
    }

    @GetMapping("/collections/{collectionName}")
    @Operation(summary = "특정 컬렉션의 저장된 게시물 목록 조회", description = "특정 컬렉션에 저장된 게시물 목록을 조회합니다.")
    public ResponseEntity<PageResponseDto<UserPostGalleryPageDto>> getSavedPostsByCollection(
            @PathVariable String collectionName,
            @AuthenticationPrincipal WebUser currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<UserPostGalleryPageDto> posts = userPostService.getSavedPostsByCollection(currentUser, collectionName, pageable);
        return ResponseEntity.ok(new PageResponseDto<>(posts));
    }
}
