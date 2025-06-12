package com.crimecat.backend.userPost.repository;

import com.crimecat.backend.userPost.domain.UserPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    /**
     * 공개 게시물 중에서 특정 ID 목록에 해당하는 게시물만 조회
     */
    @Query("SELECT p FROM UserPost p WHERE p.id IN :postIds AND p.isPrivate = false AND p.isFollowersOnly = false")
    Page<UserPost> findPublicPostsByIds(@Param("postIds") List<UUID> postIds, Pageable pageable);

    /**
     * 접근 가능한 게시물 중에서 특정 ID 목록에 해당하는 게시물만 조회
     */
    @Query("SELECT p FROM UserPost p WHERE p.id IN :postIds AND " +
            "(p.isPrivate = false AND p.isFollowersOnly = false OR " +
            "p.user.id = :userId OR " +
            "(p.isFollowersOnly = true AND EXISTS (SELECT f FROM Follow f WHERE f.follower.id = :userId AND f.following.id = p.user.id)))")
    Page<UserPost> findAccessiblePostsByIds(@Param("postIds") List<UUID> postIds, @Param("userId") UUID userId, Pageable pageable);

    /**
     * 인기도 점수 기준으로 정렬된 공개 게시물 조회
     */
    @Query("SELECT p FROM UserPost p WHERE p.isPrivate = false AND p.isFollowersOnly = false ORDER BY p.popularityScore DESC")
    Page<UserPost> findPublicPostsByPopularityScore(Pageable pageable);

    /**
     * 인기도 점수 기준으로 정렬된 접근 가능한 게시물 조회
     */
    @Query("SELECT p FROM UserPost p WHERE " +
            "(p.isPrivate = false AND p.isFollowersOnly = false OR " +
            "p.user.id = :userId OR " +
            "(p.isFollowersOnly = true AND EXISTS (SELECT f FROM Follow f WHERE f.follower.id = :userId AND f.following.id = p.user.id))) " +
            "ORDER BY p.popularityScore DESC")
    Page<UserPost> findAccessiblePostsByPopularityScore(@Param("userId") UUID userId, Pageable pageable);

    /**
     * 무작위로 공개 게시물 조회
     */
    @Query(value = "SELECT * FROM user_posts p WHERE p.is_private = false AND p.is_followers_only = false ORDER BY RANDOM() LIMIT :limits",
            nativeQuery = true)
    Page<UserPost> findRandomPublicPosts(Pageable pageable, @Param("limit") int limits);

    /**
     * 무작위로 접근 가능한 게시물 조회
     */
    @Query(value = "SELECT * FROM user_posts p WHERE " +
            "(p.is_private = false AND p.is_followers_only = false OR " +
            "p.user_id = :userId OR " +
            "(p.is_followers_only = true AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = :userId AND f.following_id = p.user_id))) " +
            "ORDER BY RAND()",
            nativeQuery = true)
    Page<UserPost> findRandomAccessiblePosts(@Param("userId") UUID userId, Pageable pageable);

    /**
     * 키워드로 공개 게시물 검색
     */
    @Query("SELECT p FROM UserPost p WHERE p.isPrivate = false AND p.isFollowersOnly = false AND LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.createdAt DESC")
    Page<UserPost> findPublicPostsByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 키워드로 접근 가능한 게시물 검색
     */
    @Query("SELECT p FROM UserPost p WHERE " +
            "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
            "(p.isPrivate = false AND p.isFollowersOnly = false OR " +
            "p.user.id = :userId OR " +
            "(p.isFollowersOnly = true AND EXISTS (SELECT f FROM Follow f WHERE f.follower.id = :userId AND f.following.id = p.user.id))) " +
            "ORDER BY p.createdAt DESC")
    Page<UserPost> findAccessiblePostsByKeyword(@Param("keyword") String keyword, @Param("userId") UUID userId, Pageable pageable);

    /**
     * 키워드와 해시태그 ID 목록으로 공개 게시물 검색
     */
    @Query("SELECT DISTINCT p FROM UserPost p WHERE p.id IN :postIds AND " +
            "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
            "p.isPrivate = false AND p.isFollowersOnly = false " +
            "ORDER BY p.createdAt DESC")
    Page<UserPost> findPublicPostsByKeywordAndIds(@Param("keyword") String keyword, @Param("postIds") List<UUID> postIds, Pageable pageable);

    /**
     * 키워드와 해시태그 ID 목록으로 접근 가능한 게시물 검색
     */
    @Query("SELECT DISTINCT p FROM UserPost p WHERE p.id IN :postIds AND " +
            "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
            "(p.isPrivate = false AND p.isFollowersOnly = false OR " +
            "p.user.id = :userId OR " +
            "(p.isFollowersOnly = true AND EXISTS (SELECT f FROM Follow f WHERE f.follower.id = :userId AND f.following.id = p.user.id))) " +
            "ORDER BY p.createdAt DESC")
    Page<UserPost> findAccessiblePostsByKeywordAndIds(@Param("keyword") String keyword, @Param("postIds") List<UUID> postIds, @Param("userId") UUID userId, Pageable pageable);
    
    /**
     * 특정 사용자의 게시물 중 컨텐츠에 키워드가 포함된 게시물 검색
     */
    @Query("SELECT p FROM UserPost p WHERE p.user = :user AND LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.createdAt DESC")
    Page<UserPost> findByUserAndContentContaining(@Param("user") com.crimecat.backend.webUser.domain.WebUser user, @Param("keyword") String keyword, Pageable pageable);
    
    /**
     * 키워드 또는 작성자 이름으로 공개 게시물 검색 (통합 검색)
     */
    @Query("SELECT p FROM UserPost p WHERE p.isPrivate = false AND p.isFollowersOnly = false AND " +
            "(LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.user.nickname) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY p.createdAt DESC")
    Page<UserPost> findPublicPostsByKeywordOrAuthor(@Param("query") String query, Pageable pageable);
    
    /**
     * 키워드 또는 작성자 이름으로 접근 가능한 게시물 검색 (통합 검색)
     */
    @Query("SELECT p FROM UserPost p WHERE " +
            "(LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.user.nickname) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(p.isPrivate = false AND p.isFollowersOnly = false OR " +
            "p.user.id = :userId OR " +
            "(p.isFollowersOnly = true AND EXISTS (SELECT f FROM Follow f WHERE f.follower.id = :userId AND f.following.id = p.user.id))) " +
            "ORDER BY p.createdAt DESC")
    Page<UserPost> findAccessiblePostsByKeywordOrAuthor(@Param("query") String query, @Param("userId") UUID userId, Pageable pageable);
    
    /**
     * 특정 사용자의 게시물 개수 조회 (다른 사용자가 접근 가능한 게시물만)
     */
    @Query("SELECT COUNT(p) FROM UserPost p " +
            "WHERE p.user.id = :authorId AND " +
            "      ((p.isPrivate = false AND p.isFollowersOnly = false) " +  // 모든 공개 게시글
            "       OR :viewerId = :authorId " +  // 본인이 조회하는 경우
            "       OR (p.isFollowersOnly = true AND EXISTS " +  // 팔로워 공개이고 조회자가 팔로워인 게시글
            "           (SELECT f FROM Follow f WHERE f.following.id = :authorId AND f.follower.id = :viewerId)))")
    Long countAccessiblePostsByUserIdForViewer(@Param("authorId") UUID authorId, @Param("viewerId") UUID viewerId);
    
    /**
     * 팔로우한 사용자들의 게시물 조회 (최신순)
     */
    @Query("SELECT p FROM UserPost p WHERE p.user.id IN :userIds AND " +
            "(p.isPrivate = false AND p.isFollowersOnly = false OR " +
            "p.user.id = :currentUserId OR " +
            "(p.isFollowersOnly = true AND EXISTS (SELECT f FROM Follow f WHERE f.follower.id = :currentUserId AND f.following.id = p.user.id))) " +
            "ORDER BY p.createdAt DESC")
    Page<UserPost> findPostsByFollowingUsers(@Param("userIds") List<UUID> userIds, @Param("currentUserId") UUID currentUserId, Pageable pageable);
    
    /**
     * 피드용 혼합 게시물 조회 (팔로우한 사용자 + 인기 게시물)
     * 최신 순으로 정렬
     */
    @Query("SELECT p FROM UserPost p WHERE " +
            "((p.user.id IN :followingIds AND " +
            "  (p.isPrivate = false AND p.isFollowersOnly = false OR " +
            "   p.user.id = :currentUserId OR " +
            "   (p.isFollowersOnly = true AND EXISTS (SELECT f FROM Follow f WHERE f.follower.id = :currentUserId AND f.following.id = p.user.id)))) " +
            " OR " +
            " (p.isPrivate = false AND p.isFollowersOnly = false AND p.popularityScore > :minPopularityScore)) " +
            "ORDER BY p.createdAt DESC")
    Page<UserPost> findFeedPosts(@Param("followingIds") List<UUID> followingIds, 
                                  @Param("currentUserId") UUID currentUserId, 
                                  @Param("minPopularityScore") Double minPopularityScore, 
                                  Pageable pageable);

    /**
     * 사이트맵용 공개 게시물 조회 (최신순)
     */
    @Query("SELECT p FROM UserPost p WHERE p.isPrivate = false AND p.isFollowersOnly = false ORDER BY p.createdAt DESC")
    List<UserPost> findPublicPostsForSitemap(Pageable pageable);
}
