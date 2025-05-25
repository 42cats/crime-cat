package com.crimecat.backend.hashtag.repository;

import com.crimecat.backend.hashtag.domain.PostHashTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostHashTagRepository extends JpaRepository<PostHashTag, UUID> {
    
    /**
     * 특정 게시물의 모든 해시태그 관계 삭제
     */
    @Modifying
    @Query("DELETE FROM PostHashTag p WHERE p.post.id = :postId")
    void deleteAllByPostId(@Param("postId") UUID postId);
    
    /**
     * 특정 게시물과 해시태그 관계 조회
     */
    @Query("SELECT p FROM PostHashTag p WHERE p.post.id = :postId AND p.hashTag.id = :hashTagId")
    PostHashTag findByPostIdAndHashTagId(@Param("postId") UUID postId, @Param("hashTagId") UUID hashTagId);
    
    /**
     * 특정 게시물에 연결된 모든 해시태그 관계 조회
     */
    List<PostHashTag> findAllByPostId(UUID postId);
    
    /**
     * 특정 해시태그를 사용하는 모든 게시물 관계 조회
     */
    List<PostHashTag> findAllByHashTagId(UUID hashTagId);
    
    /**
     * 특정 게시물과 해시태그 이름으로 관계 조회
     */
    @Query("SELECT p FROM PostHashTag p WHERE p.post.id = :postId AND LOWER(p.hashTag.name) = LOWER(:hashTagName)")
    PostHashTag findByPostIdAndHashTagName(@Param("postId") UUID postId, @Param("hashTagName") String hashTagName);
}
