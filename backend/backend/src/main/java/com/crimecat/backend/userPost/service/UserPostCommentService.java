package com.crimecat.backend.userPost.service;

import com.crimecat.backend.userPost.dto.UserPostCommentDto;
import com.crimecat.backend.userPost.dto.UserPostCommentRequest;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface UserPostCommentService {

    /**
     * 게시글에 댓글 작성
     * @param postId 게시글 ID
     * @param author 댓글 작성자
     * @param request 댓글 작성 요청
     * @return 작성된 댓글 정보
     */
    UserPostCommentDto createComment(UUID postId, WebUser author, UserPostCommentRequest request);

    /**
     * 댓글 수정
     * @param commentId 댓글 ID
     * @param author 수정 요청 사용자
     * @param request 댓글 수정 요청
     * @return 수정된 댓글 정보
     */
    UserPostCommentDto updateComment(UUID commentId, WebUser author, UserPostCommentRequest request);

    /**
     * 댓글 삭제 (소프트 딜리트)
     * @param commentId 댓글 ID
     * @param currentUser 삭제 요청 사용자
     */
    void deleteComment(UUID commentId, WebUser currentUser);

    /**
     * 게시글의 댓글 목록 조회 (페이징)
     * @param postId 게시글 ID
     * @param currentUser 조회 요청 사용자
     * @param pageable 페이지 정보
     * @return 댓글 목록
     */
    Page<UserPostCommentDto> getCommentsByPostId(UUID postId, WebUser currentUser, Pageable pageable);

    /**
     * 특정 댓글의 답글 목록 조회
     * @param commentId 댓글 ID
     * @param currentUser 조회 요청 사용자
     * @return 답글 목록
     */
    List<UserPostCommentDto> getRepliesByCommentId(UUID commentId, WebUser currentUser);

    /**
     * 댓글 조회 권한 확인
     * @param commentId 댓글 ID
     * @param currentUser 조회 요청 사용자
     * @return 댓글이 비밀 댓글이고 현재 사용자가 볼 수 있는 권한이 있는지 여부
     */
    boolean canViewComment(UUID commentId, WebUser currentUser);
}
