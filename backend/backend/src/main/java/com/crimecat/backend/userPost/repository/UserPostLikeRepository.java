package com.crimecat.backend.userPost.repository;

import com.crimecat.backend.userPost.domain.UserPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPostLikeRepository extends JpaRepository<UserPostLike, UUID> {

    boolean existsByPostIdAndUserId(UUID postId, UUID userId);

    Optional<UserPostLike> findByPostIdAndUserId(UUID postId, UUID userId);
    
    /**
     * 특정 게시글의 좋아요 수 카운트
     */
    long countByPostId(UUID postId);
}
