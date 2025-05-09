package com.crimecat.backend.comment.repository;

import com.crimecat.backend.comment.domain.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    // 사용자가 특정 댓글에 좋아요를 눌렀는지 확인
    boolean existsByUser_IdAndComment_Id(UUID userId, UUID commentId);

    // 사용자의 특정 댓글 좋아요 찾기
    Optional<CommentLike> findByUserIdAndCommentId(UUID userId, UUID commentId);
    
    // 댓글에 대한 모든 좋아요 찾기
    List<CommentLike> findByCommentId(UUID commentId);
}
