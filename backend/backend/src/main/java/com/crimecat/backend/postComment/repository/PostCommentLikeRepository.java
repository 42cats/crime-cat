package com.crimecat.backend.postComment.repository;

import com.crimecat.backend.postComment.domain.PostCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostCommentLikeRepository extends JpaRepository<PostCommentLike, UUID> {

    boolean existsByCommentIdAndUserId(UUID commentId, UUID userId);

}
