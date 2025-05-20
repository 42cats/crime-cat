package com.crimecat.backend.userPost.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.FileUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.sort.UserPostSortType;
import com.crimecat.backend.utils.sort.SortUtil;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
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
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        // ── 이미지 ID·URL 생성 ───────────────────────────────
        List<UUID>   imageIds  = new ArrayList<>();
        List<String> imageUrls = new ArrayList<>();

        if (images != null) {
            if (images.size() > 5) {
                throw ErrorStatus.USER_POST_IMAGE_COUNT_EXCEEDED.asControllerException();
            }

            for (MultipartFile file : images) {
                UUID imageId = UUID.randomUUID();
                String ext   = FileUtil.getExtension(file.getOriginalFilename()); // .jpg 등
                String url   = storageService.storeAt(
                        StorageFileType.USER_POST_IMAGE,
                        file,
                        imageId + ext);                      // uuid + 확장자

                imageIds.add(imageId);
                imageUrls.add(url);
            }
        }

        // ── 게시글 저장 ─────────────────────────────────────
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        userPostService.createUserPost(currentWebUser, content, imageIds, imageUrls);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }



    @PatchMapping("/{postId}/partial")
    public ResponseEntity<?> updateUserPostPartially(
            @PathVariable UUID postId,
            @RequestPart("content") String content,
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages,
            @RequestPart(value = "newImageIds", required = false) List<UUID> newImageIds,
            @RequestPart(value = "keepImageUrls", required = false) List<String> keepImageUrls
    ) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        userPostService.updateUserPostPartially(postId, currentUser, content, newImages, newImageIds, keepImageUrls);
        return ResponseEntity.ok().build();
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
    
    @GetMapping("/my")
    public ResponseEntity<Page<UserPostGalleryPageDto>> getMyUserPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) List<String> sort
    ) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        
        // sort 파라미터 처리
        List<UserPostSortType> sortTypes = (sort != null && !sort.isEmpty())
               ? sort.stream()
               .map(String::toUpperCase)
               .map(UserPostSortType::valueOf)
               .toList()
               : List.of(UserPostSortType.LATEST);

        // Sort 결합
        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        
        // PageRequest 생성
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        // 서비스 호출
        Page<UserPostGalleryPageDto> pageResult = 
                userPostService.getMyUserPostGalleryPage(currentUser, pageable);
                
        return ResponseEntity.ok(pageResult);
    }
}
