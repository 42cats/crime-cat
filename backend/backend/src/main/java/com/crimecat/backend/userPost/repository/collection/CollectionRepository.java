package com.crimecat.backend.userPost.repository.collection;

import com.crimecat.backend.userPost.domain.collection.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, UUID> {
    
    /**
     * 특정 사용자의 모든 컬렉션 조회
     */
    List<Collection> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    
    /**
     * 특정 사용자의 특정 이름을 가진 컬렉션 조회
     */
    Optional<Collection> findByUserIdAndName(UUID userId, String name);
    
    /**
     * 특정 사용자가 소유한 컬렉션인지 확인
     */
    boolean existsByIdAndUserId(UUID collectionId, UUID userId);
    
    /**
     * 특정 사용자의 컬렉션 수 조회
     */
    long countByUserId(UUID userId);
    
    /**
     * 컬렉션과 해당 컬렉션의 게시물 수를 함께 조회
     */
    @Query("SELECT c, COUNT(sp) as postCount " +
           "FROM Collection c " +
           "LEFT JOIN SavedPost sp ON sp.collectionName = c.name AND sp.user.id = c.user.id " +
           "WHERE c.user.id = :userId " +
           "GROUP BY c.id " +
           "ORDER BY c.createdAt DESC")
    List<Object[]> findCollectionsWithPostCount(@Param("userId") UUID userId);
    
    /**
     * 컬렉션의 첫 번째 게시물 이미지를 썸네일로 조회
     */
    @Query("SELECT sp.post.images " +
           "FROM SavedPost sp " +
           "WHERE sp.collectionName = :collectionName AND sp.user.id = :userId " +
           "AND sp.post.images IS NOT NULL AND sp.post.images != '' " +
           "ORDER BY sp.createdAt DESC " +
           "LIMIT 1")
    Optional<String> findThumbnailByCollectionNameAndUserId(@Param("collectionName") String collectionName, 
                                                           @Param("userId") UUID userId);
}