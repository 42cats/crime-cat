package com.crimecat.backend.comment.repository;

import com.crimecat.backend.comment.domain.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    // 게임 테마에 대한 최상위 댓글 조회 (페이징, 최신순)
    Page<Comment> findByGameThemeIdAndParentIdIsNullAndIsDeletedFalseOrderByCreatedAtDesc(
            UUID gameThemeId, Pageable pageable);
    
    // 게임 테마에 대한 최상위 댓글 조회 (페이징, 인기순)
    Page<Comment> findByGameThemeIdAndParentIdIsNullAndIsDeletedFalseOrderByLikesDescCreatedAtDesc(
            UUID gameThemeId, Pageable pageable);
    
    // 부모 댓글에 대한 대댓글 조회
    List<Comment> findByParentIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID parentId);
    
    // 특정 사용자가 작성한 댓글 조회
    Page<Comment> findByAuthorIdAndIsDeletedFalseOrderByCreatedAtDesc(
            UUID authorId, Pageable pageable);
}
