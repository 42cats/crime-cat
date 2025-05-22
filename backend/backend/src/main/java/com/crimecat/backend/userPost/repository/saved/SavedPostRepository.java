package com.crimecat.backend.userPost.repository.saved;

import com.crimecat.backend.userPost.domain.saved.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {
    
    /**
     * 사용자 ID와 게시물 ID로 저장된 게시물 조회
     */
    Optional<SavedPost> findByUserIdAndPostId(UUID userId, UUID postId);
    
    /**
     * 특정 사용자가 저장한 모든 게시물 조회 (페이징)
     */
    Page<SavedPost> findAllByUserId(UUID userId, Pageable pageable);
    
    /**
     * 특정 사용자가 특정 컬렉션에 저장한 게시물 조회 (페이징)
     */
    Page<SavedPost> findAllByUserIdAndCollectionName(UUID userId, String collectionName, Pageable pageable);
    
    /**
     * 특정 사용자의 모든 컬렉션 이름 목록 조회
     */
    @Query("SELECT DISTINCT s.collectionName FROM SavedPost s WHERE s.user.id = :userId AND s.collectionName IS NOT NULL")
    List<String> findAllCollectionNamesByUserId(@Param("userId") UUID userId);
    
    /**
     * 특정 게시물을 저장한 사용자 수 집계
     */
    @Query("SELECT COUNT(s) FROM SavedPost s WHERE s.post.id = :postId")
    long countByPostId(@Param("postId") UUID postId);
    
    /**
     * 특정 게시물이 저장되었는지 확인
     */
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
    
    /**
     * 사용자의 특정 컨렉션에 있는 게시물 수 집계
     */
    @Query("SELECT COUNT(s) FROM SavedPost s WHERE s.user.id = :userId AND s.collectionName = :collectionName")
    long countByUserIdAndCollectionName(@Param("userId") UUID userId, @Param("collectionName") String collectionName);
    
    /**
     * 컨렉션 이름 변경 (모든 해당 컨렉션의 SavedPost 업데이트)
     */
    @Modifying
    @Query("UPDATE SavedPost s SET s.collectionName = :newName WHERE s.user.id = :userId AND s.collectionName = :oldName")
    void updateCollectionName(@Param("userId") UUID userId, @Param("oldName") String oldName, @Param("newName") String newName);
    
    /**
     * 컨렉션 삭제 시 해당 컨렉션의 모든 SavedPost의 collectionName을 null로 변경
     */
    @Modifying
    @Query("UPDATE SavedPost s SET s.collectionName = NULL WHERE s.user.id = :userId AND s.collectionName = :collectionName")
    void removeCollectionName(@Param("userId") UUID userId, @Param("collectionName") String collectionName);
}
