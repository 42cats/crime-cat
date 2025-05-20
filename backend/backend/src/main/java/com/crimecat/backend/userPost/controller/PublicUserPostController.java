package com.crimecat.backend.userPost.controller;

import com.crimecat.backend.userPost.dto.UserPostDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.service.UserPostService;
import com.crimecat.backend.userPost.sort.UserPostSortType;
import com.crimecat.backend.utils.sort.SortUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/user-posts")
public class PublicUserPostController {

    private final UserPostService userPostService;

    @GetMapping("/{postId}")
    public ResponseEntity<UserPostDto> getUserPost(@PathVariable UUID postId) {
        // 비인증 사용자는 공개 게시글만 볼 수 있음 (비밀글, 팔로워 공개 필터링)
        return ResponseEntity.ok(userPostService.getUserPostDetail(postId, null));
    }

    @GetMapping
    public ResponseEntity<Page<UserPostGalleryPageDto>> getAllUserPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) List<String> sort
    ) {
        // 비인증 사용자는 공개 게시글만 볼 수 있음 (비밀글, 팔로워 공개 필터링)
        List<UserPostSortType> sortTypes = (sort != null && !sort.isEmpty())
               ? sort.stream()
               .map(String::toUpperCase)
               .map(UserPostSortType::valueOf)
               .toList()
               : List.of(UserPostSortType.LATEST);

        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        // null을 전달하여 공개 게시글만 조회
        Page<UserPostGalleryPageDto> pageResult = 
                userPostService.getUserPostGalleryPage(null, pageable);
                
        return ResponseEntity.ok(pageResult);
    }

    @GetMapping("/gallery/{userId}")
    public ResponseEntity<Page<UserPostGalleryPageDto>> getUserPostGalleryPage(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false)    List<String> sort   // ↙ 사용자가 다중 정렬 지정 가능
    ) {
        // ① sort 파라미터가 없으면 기본 LATEST
        List<UserPostSortType> sortTypes = (sort != null && !sort.isEmpty())
                ? sort.stream()
                .map(String::toUpperCase)
                .map(UserPostSortType::valueOf)
                .toList()
                : List.of(UserPostSortType.LATEST);

        // ② 다중 Sort 결합
        Sort resolvedSort = SortUtil.combineSorts(sortTypes);

        // ③ PageRequest 생성
        Pageable pageable = PageRequest.of(page, size, resolvedSort);

        // ④ 서비스 호출 - userId 전달, null을 전달하여 공개 게시글만 조회
        Page<UserPostGalleryPageDto> pageResult =
                userPostService.getUserPostGalleryPageByUserId(userId, null, pageable);

        return ResponseEntity.ok(pageResult);
    }
}
