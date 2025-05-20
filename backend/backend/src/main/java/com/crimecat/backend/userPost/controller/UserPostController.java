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
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "isPrivate", defaultValue = "false") boolean isPrivate,
            @RequestParam(value = "isFollowersOnly", defaultValue = "false") boolean isFollowersOnly) {

        // ── 이미지 ID·URL 생성 ──────────────────────────────
        List<UUID>   imageIds  = new ArrayList<>();
        List<String> imageUrls = new ArrayList<>();

        if (images != null) {
            if (images.size() > 5) {
                throw ErrorStatus.USER_POST_IMAGE_COUNT_EXCEEDED.asControllerException();
            }

            for (MultipartFile file : images) {
                UUID imageId = UUID.randomUUID();
                
                // UUID만 사용
                String fileId = imageId.toString();
                
                // 이미지 저장 (StorageService에서 자동으로 확장자 추가함)
                String url = storageService.storeAt(
                        StorageFileType.USER_POST_IMAGE,
                        file,
                        fileId);   // uuid만 전달

                imageIds.add(imageId);
                imageUrls.add(url);
            }
        }

        // ── 게시글 저장 ───────────────────────────────
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
        userPostService.createUserPost(currentWebUser, content, imageIds, imageUrls, isPrivate, isFollowersOnly);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{postId}")
    public ResponseEntity<?> getUserPost(@PathVariable UUID postId) {
        WebUser currentWebUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        return ResponseEntity.ok(userPostService.getUserPostDetail(postId, currentWebUser));
    }

    @PatchMapping(value = "/{postId}/partial", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateUserPostPartially(
            @PathVariable UUID postId,
            @RequestParam("content") String content,
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages,
            @RequestParam(value = "newImageIds", required = false) String newImageIdsJson,
            @RequestParam(value = "keepImageUrls", required = false) String keepImageUrlsJson,
            @RequestParam(value = "isPrivate", defaultValue = "false") boolean isPrivate,
            @RequestParam(value = "isFollowersOnly", defaultValue = "false") boolean isFollowersOnly
    ) {
        System.out.println("======= 포스트 업데이트 요청 받음 =======");
        System.out.println("postId: " + postId);
        System.out.println("content: " + content);
        System.out.println("newImages: " + (newImages != null ? newImages.size() : "null"));
        System.out.println("newImageIdsJson: " + newImageIdsJson);
        System.out.println("keepImageUrlsJson: " + keepImageUrlsJson);
        System.out.println("isPrivate: " + isPrivate);
        System.out.println("isFollowersOnly: " + isFollowersOnly);
        
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        
        // JSON 문자열을 파싱하여 List로 변환
        List<UUID> newImageIds = null;
        List<String> keepImageUrls = null;
        
        try {
            // ObjectMapper를 사용하여 JSON 문자열 파싱
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            
            if (newImageIdsJson != null && !newImageIdsJson.isEmpty()) {
                // JSON 문자열을 UUID 배열로 변환
                newImageIds = objectMapper.readValue(newImageIdsJson, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, UUID.class));
                System.out.println("파싱된 newImageIds: " + newImageIds);
            }
            
            if (keepImageUrlsJson != null && !keepImageUrlsJson.isEmpty()) {
                // JSON 문자열을 문자열 배열로 변환
                keepImageUrls = objectMapper.readValue(keepImageUrlsJson, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                System.out.println("파싱된 keepImageUrls: " + keepImageUrls);
            }
        } catch (Exception e) {
            // JSON 파싱 오류 처리
            System.out.println("JSON 파싱 오류: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Invalid JSON format: " + e.getMessage(), e);
        }
        
        userPostService.updateUserPostPartially(postId, currentUser, content, newImages, newImageIds, keepImageUrls, isPrivate, isFollowersOnly);
        System.out.println("포스트 업데이트 완료: " + postId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deleteUserPost(
            @PathVariable UUID postId
    ) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
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
    
    @GetMapping
    public ResponseEntity<Page<UserPostGalleryPageDto>> getAllUserPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) List<String> sort
    ) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        
        List<UserPostSortType> sortTypes = (sort != null && !sort.isEmpty())
               ? sort.stream()
               .map(String::toUpperCase)
               .map(UserPostSortType::valueOf)
               .toList()
               : List.of(UserPostSortType.LATEST);

        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        // 접근 가능한 게시글만 조회 (비밀글, 팔로워 공개 필터링)
        Page<UserPostGalleryPageDto> pageResult = 
                userPostService.getUserPostGalleryPage(currentUser, pageable);
                
        return ResponseEntity.ok(pageResult);
    }
    
    @GetMapping("/users/{userId}")
    public ResponseEntity<Page<UserPostGalleryPageDto>> getUserPostsByUserId(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) List<String> sort
    ) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        
        List<UserPostSortType> sortTypes = (sort != null && !sort.isEmpty())
               ? sort.stream()
               .map(String::toUpperCase)
               .map(UserPostSortType::valueOf)
               .toList()
               : List.of(UserPostSortType.LATEST);

        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        // 접근 가능한 게시글만 조회 (비밀글, 팔로워 공개 필터링)
        Page<UserPostGalleryPageDto> pageResult = 
                userPostService.getUserPostGalleryPageByUserId(userId, currentUser, pageable);
                
        return ResponseEntity.ok(pageResult);
    }
}
