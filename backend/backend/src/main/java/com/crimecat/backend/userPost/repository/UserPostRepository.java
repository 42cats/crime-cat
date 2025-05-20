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
     * 유저, 이미지까지 페치 조인하여 단건 조회
     */
    @Query("SELECT p FROM UserPost p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.images " +
            "WHERE p.id = :postId")
    Optional<UserPost> findByIdWithUserAndImages(UUID postId);

    /**
     * 유저, 이미지 포함 페이징 조회
     */
    @Query(value = "SELECT DISTINCT p FROM UserPost p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.images",
            countQuery = "SELECT COUNT(p) FROM UserPost p")
    Page<UserPost> findAllWithUserAndImages(Pageable pageable);

    @Query("SELECT p FROM UserPost p " +
                "LEFT JOIN FETCH p.images " +
                "WHERE p.id = :postId")
    Optional<UserPost> findByIdWithImages(UUID postId);
    
    /**
     * 특정 사용자의 게시글 목록 페이징 조회 (이미지 포함, 좋아요는 사용자 텍스트 조인)
     */
    @Query(value = "SELECT DISTINCT p FROM UserPost p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.images " +
            "WHERE p.user = :user",
            countQuery = "SELECT COUNT(p) FROM UserPost p WHERE p.user = :user")
    Page<UserPost> findByUserWithImages(com.crimecat.backend.webUser.domain.WebUser user, Pageable pageable);


}
