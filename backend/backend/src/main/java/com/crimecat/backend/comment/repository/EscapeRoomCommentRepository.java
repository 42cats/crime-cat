package com.crimecat.backend.comment.repository;

import com.crimecat.backend.comment.domain.EscapeRoomComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscapeRoomCommentRepository extends JpaRepository<EscapeRoomComment, UUID> {
    
    /**
     * 특정 테마의 모든 댓글 조회 (삭제되지 않은 것만)
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "LEFT JOIN FETCH ec.escapeRoomHistory eh " +
           "LEFT JOIN FETCH ec.parentComment pc " +
           "WHERE ec.escapeRoomTheme.id = :themeId " +
           "AND ec.deletedAt IS NULL " +
           "ORDER BY ec.createdAt DESC")
    Page<EscapeRoomComment> findByEscapeRoomThemeIdAndDeletedAtIsNull(
            @Param("themeId") UUID themeId, Pageable pageable);
    
    /**
     * 특정 사용자의 모든 댓글 조회 (삭제되지 않은 것만)
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.escapeRoomTheme et " +
           "LEFT JOIN FETCH ec.escapeRoomHistory eh " +
           "LEFT JOIN FETCH ec.parentComment pc " +
           "WHERE ec.webUser.id = :webUserId " +
           "AND ec.deletedAt IS NULL " +
           "ORDER BY ec.createdAt DESC")
    Page<EscapeRoomComment> findByWebUserIdAndDeletedAtIsNull(
            @Param("webUserId") UUID webUserId, Pageable pageable);
    
    /**
     * 특정 사용자가 특정 테마에 댓글을 작성했는지 확인
     */
    boolean existsByWebUserIdAndEscapeRoomThemeIdAndDeletedAtIsNull(
            UUID webUserId, UUID escapeRoomThemeId);
    
    /**
     * 특정 댓글 조회 (삭제되지 않은 것만)
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "JOIN FETCH ec.escapeRoomTheme et " +
           "LEFT JOIN FETCH ec.escapeRoomHistory eh " +
           "LEFT JOIN FETCH ec.parentComment pc " +
           "WHERE ec.id = :commentId " +
           "AND ec.deletedAt IS NULL")
    Optional<EscapeRoomComment> findByIdAndDeletedAtIsNull(@Param("commentId") UUID commentId);
    
    /**
     * 특정 게임 기록에 연결된 댓글 조회
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "WHERE ec.escapeRoomHistory.id = :historyId " +
           "AND ec.deletedAt IS NULL")
    List<EscapeRoomComment> findByEscapeRoomHistoryIdAndDeletedAtIsNull(
            @Param("historyId") UUID historyId);
    
    /**
     * 특정 테마의 댓글 수 조회 (삭제되지 않은 것만)
     */
    long countByEscapeRoomThemeIdAndDeletedAtIsNull(UUID escapeRoomThemeId);
    
    /**
     * 특정 테마의 스포일러가 아닌 댓글 수 조회
     */
    long countByEscapeRoomThemeIdAndIsSpoilerFalseAndDeletedAtIsNull(UUID escapeRoomThemeId);
    
    /**
     * 특정 댓글의 대댓글 조회
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "WHERE ec.parentComment.id = :parentId " +
           "AND ec.deletedAt IS NULL " +
           "ORDER BY ec.createdAt ASC")
    List<EscapeRoomComment> findRepliesByParentIdAndDeletedAtIsNull(@Param("parentId") UUID parentId);
}