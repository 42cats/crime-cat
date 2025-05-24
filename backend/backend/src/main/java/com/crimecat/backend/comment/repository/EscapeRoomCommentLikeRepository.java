package com.crimecat.backend.comment.repository;

import com.crimecat.backend.comment.domain.EscapeRoomCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscapeRoomCommentLikeRepository extends JpaRepository<EscapeRoomCommentLike, UUID> {
    
    /**
     * 특정 댓글에 대한 특정 사용자의 좋아요 존재 여부 확인
     */
    boolean existsByCommentIdAndWebUserId(UUID commentId, UUID webUserId);
    
    /**
     * 특정 댓글에 대한 특정 사용자의 좋아요 조회
     */
    Optional<EscapeRoomCommentLike> findByCommentIdAndWebUserId(UUID commentId, UUID webUserId);
    
    /**
     * 특정 댓글에 대한 특정 사용자의 좋아요 삭제
     */
    void deleteByCommentIdAndWebUserId(UUID commentId, UUID webUserId);
    
    /**
     * 특정 댓글의 좋아요 수 조회
     */
    long countByCommentId(UUID commentId);
    
    /**
     * 특정 사용자가 특정 댓글들에 좋아요했는지 확인 (벌크 조회)
     */
    @Query("SELECT DISTINCT ecl.comment.id FROM EscapeRoomCommentLike ecl " +
           "WHERE ecl.comment.id IN :commentIds AND ecl.webUser.id = :webUserId")
    java.util.Set<UUID> findLikedCommentIdsByUserIdAndCommentIds(@Param("webUserId") UUID webUserId, 
                                                                  @Param("commentIds") java.util.Collection<UUID> commentIds);
}