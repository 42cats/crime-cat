package com.crimecat.backend.comment.repository;

import com.crimecat.backend.comment.domain.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    // 게임 테마에 대한 최상위 댓글 조회 (페이징, 정렬 옵션 적용)
    @EntityGraph(attributePaths = {"author", "gameTheme"})
    Page<Comment> findByGameThemeIdAndParentIdIsNullAndIsDeletedFalse(
            UUID gameThemeId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "gameTheme"})
    Page<Comment> findByGameThemeIdAndParentIdIsNull(UUID gameThemeId, Pageable pageable);

    // 부모 댓글에 대한 대댓글 조회
    @EntityGraph(attributePaths = {"author"})
    List<Comment> findByParentIdAndIsDeletedFalse(UUID parentId, Sort sort);

    @EntityGraph(attributePaths = {"author"})
    List<Comment> findByParentId(UUID parentId, Sort sort);
    
    // 특정 사용자가 작성한 댓글 조회
    @EntityGraph(attributePaths = {"author", "gameTheme"})
    Page<Comment> findByAuthorIdAndIsDeletedFalse(
            UUID authorId, Pageable pageable);
}
