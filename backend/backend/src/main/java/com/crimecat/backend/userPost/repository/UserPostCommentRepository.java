package com.crimecat.backend.userPost.repository;

import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.UserPostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPostCommentRepository extends JpaRepository<UserPostComment, UUID> {

    /**
     * 특정 게시글의 최상위 댓글만 페이징 조회 (부모 댓글이 없는 댓글)
     */
    @Query("SELECT c FROM UserPostComment c " +
            "WHERE c.post.id = :postId AND c.parent IS NULL " +
            "ORDER BY c.createdAt ASC")
    Page<UserPostComment> findParentCommentsByPostId(UUID postId, Pageable pageable);

    /**
     * 특정 게시글의 모든 댓글 조회 (페이징 없이)
     */
    @Query("SELECT c FROM UserPostComment c " +
            "LEFT JOIN FETCH c.author " +
            "WHERE c.post.id = :postId " +
            "ORDER BY c.createdAt ASC")
    List<UserPostComment> findAllCommentsByPostId(UUID postId);

    /**
     * 특정 게시글의 모든 대댓글 (답글) 조회
     */
    @Query("SELECT c FROM UserPostComment c " +
            "LEFT JOIN FETCH c.author " +
            "WHERE c.post.id = :postId AND c.parent IS NOT NULL " +
            "ORDER BY c.createdAt ASC")
    List<UserPostComment> findAllRepliesByPostId(UUID postId);

    /**
     * 특정 댓글의 모든 답글 조회
     */
    @Query("SELECT c FROM UserPostComment c " +
            "LEFT JOIN FETCH c.author " +
            "WHERE c.parent.id = :commentId " +
            "ORDER BY c.createdAt ASC")
    List<UserPostComment> findAllRepliesByCommentId(UUID commentId);

    /**
     * 댓글 ID로 조회 (작성자 JOIN)
     */
    @Query("SELECT c FROM UserPostComment c " +
            "LEFT JOIN FETCH c.author " +
            "WHERE c.id = :commentId")
    Optional<UserPostComment> findByIdWithAuthor(UUID commentId);
    
    /**
     * 댓글 ID로 조회 (작성자, 게시글 JOIN)
     */
    @Query("SELECT c FROM UserPostComment c " +
            "LEFT JOIN FETCH c.author " +
            "LEFT JOIN FETCH c.post p " +
            "LEFT JOIN FETCH p.user " +
            "WHERE c.id = :commentId")
    Optional<UserPostComment> findByIdWithAuthorAndPost(UUID commentId);
    
    /**
     * 특정 게시글의 댓글 수 카운트
     */
    long countByPostId(UUID postId);
}
