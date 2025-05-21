package com.crimecat.backend.hashtag.repository;

import com.crimecat.backend.hashtag.domain.HashTag;
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
public interface HashTagRepository extends JpaRepository<HashTag, UUID> {
    
    /**
     * 해시태그 이름으로 검색
     */
    Optional<HashTag> findByNameIgnoreCase(String name);
    
    /**
     * 해시태그 이름이 포함된 해시태그 검색 (자동완성용)
     */
    Page<HashTag> findByNameContainingIgnoreCase(String namePattern, Pageable pageable);
    
    /**
     * 인기 해시태그 조회 (사용 횟수 기준)
     */
    Page<HashTag> findAllByOrderByUseCountDesc(Pageable pageable);
    
    /**
     * 특정 게시물에 연결된 해시태그 목록 조회
     */
    @Query("SELECT h FROM HashTag h JOIN h.posts p WHERE p.post.id = :postId")
    List<HashTag> findAllByPostId(@Param("postId") UUID postId);
    
    /**
     * 특정 사용자의 게시물에서 사용한 해시태그 목록 조회
     */
    @Query("SELECT h FROM HashTag h JOIN h.posts p WHERE p.post.user.id = :userId")
    Page<HashTag> findAllByUserId(@Param("userId") UUID userId, Pageable pageable);
    
    /**
     * 특정 해시태그들이 모두 포함된 게시물 ID 목록 조회
     */
    @Query(value = "SELECT p.post_id FROM post_hashtags p " +
            "JOIN hashtags h ON p.hashtag_id = h.id " +
            "WHERE LOWER(h.name) IN :tagNames " +
            "GROUP BY p.post_id " +
            "HAVING COUNT(DISTINCT h.id) = :tagCount", 
            nativeQuery = true)
    List<UUID> findPostIdsWithAllHashTags(@Param("tagNames") List<String> tagNames, @Param("tagCount") long tagCount);
}
