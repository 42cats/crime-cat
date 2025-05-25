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
     * 특정 테마의 모든 댓글 조회 (페이징)
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "LEFT JOIN FETCH ec.escapeRoomHistory eh " +
           "LEFT JOIN FETCH ec.parentComment pc " +
           "WHERE ec.escapeRoomTheme.id = :themeId " +
           "ORDER BY ec.createdAt DESC")
    Page<EscapeRoomComment> findByEscapeRoomThemeId(
            @Param("themeId") UUID themeId, Pageable pageable);
    
    /**
     * 특정 테마의 모든 댓글 목록 조회 (페이징 없이)
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "LEFT JOIN FETCH ec.escapeRoomHistory eh " +
           "LEFT JOIN FETCH ec.parentComment pc " +
           "WHERE ec.escapeRoomTheme.id = :themeId " +
           "ORDER BY ec.createdAt DESC")
    List<EscapeRoomComment> findAllByEscapeRoomThemeId(
            @Param("themeId") UUID themeId);
    
    /**
     * 특정 사용자의 모든 댓글 조회
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.escapeRoomTheme et " +
           "LEFT JOIN FETCH ec.escapeRoomHistory eh " +
           "LEFT JOIN FETCH ec.parentComment pc " +
           "WHERE ec.webUser.id = :webUserId " +
           "AND (ec.deletedAt IS NULL OR ec.isDeleted = true) " +
           "ORDER BY ec.createdAt DESC")
    Page<EscapeRoomComment> findByWebUserId(
            @Param("webUserId") UUID webUserId, Pageable pageable);
    
    /**
     * 특정 사용자가 특정 테마에 댓글을 작성했는지 확인
     */
    @Query("SELECT COUNT(ec) > 0 FROM EscapeRoomComment ec " +
           "WHERE ec.webUser.id = :webUserId " +
           "AND ec.escapeRoomTheme.id = :escapeRoomThemeId " +
           "AND ec.deletedAt IS NULL")
    boolean existsByWebUserIdAndEscapeRoomThemeId(
            @Param("webUserId") UUID webUserId, 
            @Param("escapeRoomThemeId") UUID escapeRoomThemeId);
    
    /**
     * 특정 댓글 조회
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "JOIN FETCH ec.escapeRoomTheme et " +
           "LEFT JOIN FETCH ec.escapeRoomHistory eh " +
           "LEFT JOIN FETCH ec.parentComment pc " +
           "WHERE ec.id = :commentId")
    Optional<EscapeRoomComment> findByIdWithDetails(@Param("commentId") UUID commentId);
    
    /**
     * 특정 게임 기록에 연결된 댓글 조회
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "WHERE ec.escapeRoomHistory.id = :historyId " +
           "AND ec.deletedAt IS NULL")
    List<EscapeRoomComment> findByEscapeRoomHistoryId(
            @Param("historyId") UUID historyId);
    
    /**
     * 특정 테마의 댓글 수 조회
     */
    @Query("SELECT COUNT(ec) FROM EscapeRoomComment ec " +
           "WHERE ec.escapeRoomTheme.id = :escapeRoomThemeId " +
           "AND ec.deletedAt IS NULL")
    long countByEscapeRoomThemeId(@Param("escapeRoomThemeId") UUID escapeRoomThemeId);
    
    /**
     * 특정 테마의 스포일러가 아닌 댓글 수 조회
     */
    @Query("SELECT COUNT(ec) FROM EscapeRoomComment ec " +
           "WHERE ec.escapeRoomTheme.id = :escapeRoomThemeId " +
           "AND ec.isSpoiler = false " +
           "AND ec.deletedAt IS NULL")
    long countNonSpoilerCommentsByThemeId(@Param("escapeRoomThemeId") UUID escapeRoomThemeId);
    
    /**
     * 특정 댓글의 대댓글 조회
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "WHERE ec.parentComment.id = :parentId " +
           "ORDER BY ec.createdAt ASC")
    List<EscapeRoomComment> findRepliesByParentId(@Param("parentId") UUID parentId);
    
    /**
     * 특정 부모 댓글의 대댓글 목록 조회
     */
    @Query("SELECT ec FROM EscapeRoomComment ec " +
           "JOIN FETCH ec.webUser u " +
           "WHERE ec.parentComment.id = :parentCommentId " +
           "ORDER BY ec.createdAt ASC")
    List<EscapeRoomComment> findAllByParentCommentId(
            @Param("parentCommentId") UUID parentCommentId);
    
    /**
     * 특정 부모 댓글의 대댓글 수 조회 (삭제되지 않은 것만)
     */
    @Query("SELECT COUNT(ec) FROM EscapeRoomComment ec " +
           "WHERE ec.parentComment.id = :parentCommentId " +
           "AND ec.deletedAt IS NULL")
    long countByParentCommentId(@Param("parentCommentId") UUID parentCommentId);
}