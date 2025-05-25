package com.crimecat.backend.userPost.controller;

import org.springframework.http.ResponseEntity;
import com.crimecat.backend.userPost.dto.UserPostCommentDto;
import com.crimecat.backend.userPost.service.UserPostCommentService;
import com.crimecat.backend.userPost.sort.UserPostCommentSortType;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.sort.SortUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/user-posts")
public class PublicUserPostCommentController {

    private final UserPostCommentService userPostCommentService;

    /**
     * 게시글의 댓글 목록 조회 (공개 API)
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<Page<UserPostCommentDto>> getCommentsByPostId(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) List<String> sort) {
        
        // 비로그인 사용자는 null로 전달
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        
        // 정렬 타입 변환
        List<UserPostCommentSortType> sortTypes = (sort != null && !sort.isEmpty())
                ? sort.stream()
                  .map(String::toUpperCase)
                  .map(UserPostCommentSortType::valueOf)
                  .toList()
                : List.of(UserPostCommentSortType.LATEST);

        // 정렬 타입 조합으로 Sort 객체 생성
        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        
        // 페이지네이션 객체 생성
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        // 서비스 호출 (비밀댓글은 서비스 로직에서 필터링)
        Page<UserPostCommentDto> comments = userPostCommentService.getCommentsByPostId(postId, currentUser, pageable);
        
        return ResponseEntity.ok(comments);
    }

    /**
     * 특정 댓글의 답글 목록 조회
     */
    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<List<UserPostCommentDto>> getRepliesByCommentId(@PathVariable UUID commentId) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        List<UserPostCommentDto> replies = userPostCommentService.getRepliesByCommentId(commentId, currentUser);
        return ResponseEntity.ok(replies);
    }
}
