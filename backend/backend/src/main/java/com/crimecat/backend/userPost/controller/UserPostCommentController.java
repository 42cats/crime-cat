package com.crimecat.backend.userPost.controller;

import org.springframework.http.ResponseEntity;
import com.crimecat.backend.userPost.dto.UserPostCommentDto;
import com.crimecat.backend.userPost.dto.UserPostCommentRequest;
import com.crimecat.backend.userPost.service.UserPostCommentService;
import com.crimecat.backend.userPost.sort.UserPostCommentSortType;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.sort.SortUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user-posts")
@RequiredArgsConstructor
public class UserPostCommentController {

    private final UserPostCommentService userPostCommentService;

    /**
     * 댓글 작성
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<UserPostCommentDto> createComment(
            @PathVariable UUID postId,
            @Valid @RequestBody UserPostCommentRequest request) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UserPostCommentDto createdComment = userPostCommentService.createComment(postId, currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComment);
    }

    /**
     * 댓글 수정
     */
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<UserPostCommentDto> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody UserPostCommentRequest request) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UserPostCommentDto updatedComment = userPostCommentService.updateComment(commentId, currentUser, request);
        return ResponseEntity.ok(updatedComment);
    }

    /**
     * 댓글 삭제
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        userPostCommentService.deleteComment(commentId, currentUser);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글의 댓글 목록 조회
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<Page<UserPostCommentDto>> getCommentsByPostId(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) List<String> sort) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUserOptional().orElse(null);
        
        // 정렬 타입 변환
        List<UserPostCommentSortType> sortTypes = (sort != null && !sort.isEmpty())
                ? sort.stream()
                  .map(String::toUpperCase)
                  .map(typeName -> {
                      try {
                          return UserPostCommentSortType.valueOf(typeName);
                      } catch (IllegalArgumentException e) {
                          // 잘못된 정렬 타입은 기본값으로 대체
                          return UserPostCommentSortType.LATEST;
                      }
                  })
                  .toList()
                : List.of(UserPostCommentSortType.LATEST);

        // 각 정렬 타입에서 정의한 Sort 객체 사용
        Sort resolvedSort = sortTypes.stream()
                .map(UserPostCommentSortType::getSort)
                .reduce(Sort::and)
                .orElse(Sort.by(Sort.Direction.DESC, "createdAt"));
        
        // 페이지네이션 객체 생성
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        // 서비스 호출
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
