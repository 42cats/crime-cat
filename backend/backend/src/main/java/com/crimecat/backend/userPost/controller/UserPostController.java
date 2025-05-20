package com.crimecat.backend.userPost.controller;

import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user-posts")
public class UserPostController {

    private final UserPostService userPostService;
    private final StorageService storageService;

    @PostMapping
    public ResponseEntity<?> createUserPost(
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        List<String> imageUrls = images != null ? images.stream()
                .limit(5)
                .map(file -> storageService.storeAt(StorageFileType.USER_POST_IMAGE, file, UUID.randomUUID().toString()))
                .toList() : List.of();

        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        userPostService.createUserPost(currentWebUser, content, imageUrls);
        return ResponseEntity.ok(HttpStatus.CREATED);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<?> updateUserPost(
            @PathVariable UUID postId,
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        List<String> imageUrls = images != null ? images.stream()
                .limit(5)
                .map(file -> storageService.storeAt(StorageFileType.USER_POST_IMAGE, file, UUID.randomUUID().toString()))
                .toList() : List.of();

        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        userPostService.updateUserPost(postId, currentWebUser, content, imageUrls);
        return ResponseEntity.ok(HttpStatus.ACCEPTED);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deleteUserPost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal(expression = "webUser") @NotNull Object currentUser
    ) {
        userPostService.deleteUserPost(postId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{postId}/likes/me")
    public ResponseEntity<?> didILikeUserPost(
            @PathVariable UUID postId
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        boolean liked = userPostService.didILike(postId, currentWebUser);
        return ResponseEntity.ok(liked);
    }

    @PostMapping("/{postId}/likes/toggle")
    public ResponseEntity<?> toggleUserPostLike(
            @PathVariable UUID postId
    ) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        boolean nowLiked = userPostService.toggleLike(postId, currentWebUser);
        return ResponseEntity.ok(nowLiked);
    }
}
