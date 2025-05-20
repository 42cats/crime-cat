package com.crimecat.backend.userPost.repository;

import com.crimecat.backend.userPost.domain.UserPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPostRepository extends JpaRepository<UserPost, UUID> {

    /**
     * 유저, 이미지, 좋아요까지 페치 조인하여 단건 조회
     */
    @Query("SELECT p FROM UserPost p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.images " +
            "LEFT JOIN FETCH p.likes " +
            "WHERE p.id = :postId")
    Optional<UserPost> findByIdWithUserAndImages(UUID postId);

    /**
     * 유저, 이미지, 좋아요 포함 페이징 조회
     */
    @Query(value = "SELECT DISTINCT p FROM UserPost p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.images " +
            "LEFT JOIN FETCH p.likes",
            countQuery = "SELECT COUNT(p) FROM UserPost p")
    Page<UserPost> findAllWithUserAndImages(Pageable pageable);
}
