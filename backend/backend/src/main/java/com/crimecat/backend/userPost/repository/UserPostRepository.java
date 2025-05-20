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
    
    /**
     * 공개 게시글 및 특정 사용자가 접근 가능한 게시글 목록 조회 (이미지 포함)
     * 모든 공개 게시글 + 내가 쓴 비공개 게시글 + 팔로워 공개이고 내가 팔로워인 게시글
     */
    @Query(value = "SELECT DISTINCT p FROM UserPost p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.images " +
            "WHERE (p.isPrivate = false AND p.isFollowersOnly = false) " +  // 모든 공개 게시글
            "   OR p.user.id = :userId " +  // 내가 쓴 게시글
            "   OR (p.isFollowersOnly = true AND EXISTS " +  // 팔로워 공개이고 내가 팔로워인 게시글
            "       (SELECT f FROM Follow f WHERE f.following.id = p.user.id AND f.follower.id = :userId))",
            countQuery = "SELECT COUNT(p) FROM UserPost p " +
                    "WHERE (p.isPrivate = false AND p.isFollowersOnly = false) " +
                    "   OR p.user.id = :userId " +
                    "   OR (p.isFollowersOnly = true AND EXISTS " +
                    "       (SELECT f FROM Follow f WHERE f.following.id = p.user.id AND f.follower.id = :userId))")
    Page<UserPost> findAccessiblePostsForUser(UUID userId, Pageable pageable);
    
    /**
     * 특정 사용자가 쓴 게시글 중 다른 사용자가 접근 가능한 게시글만 조회
     */
    @Query(value = "SELECT DISTINCT p FROM UserPost p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.images " +
            "WHERE p.user.id = :authorId AND " +
            "      ((p.isPrivate = false AND p.isFollowersOnly = false) " +  // 모든 공개 게시글
            "       OR p.user.id = :viewerId " +  // 내가 쓴 게시글
            "       OR (p.isFollowersOnly = true AND EXISTS " +  // 팔로워 공개이고 내가 팔로워인 게시글
            "           (SELECT f FROM Follow f WHERE f.following.id = :authorId AND f.follower.id = :viewerId)))",
            countQuery = "SELECT COUNT(p) FROM UserPost p " +
                    "WHERE p.user.id = :authorId AND " +
                    "      ((p.isPrivate = false AND p.isFollowersOnly = false) " +
                    "       OR p.user.id = :viewerId " +
                    "       OR (p.isFollowersOnly = true AND EXISTS " +
                    "           (SELECT f FROM Follow f WHERE f.following.id = :authorId AND f.follower.id = :viewerId)))")
    Page<UserPost> findAccessiblePostsByUserIdForViewer(UUID authorId, UUID viewerId, Pageable pageable);


}
