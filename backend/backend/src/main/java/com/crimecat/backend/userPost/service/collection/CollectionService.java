package com.crimecat.backend.userPost.service.collection;

import com.crimecat.backend.userPost.domain.collection.Collection;
import com.crimecat.backend.userPost.dto.collection.CollectionDto;
import com.crimecat.backend.userPost.dto.collection.CreateCollectionDto;
import com.crimecat.backend.userPost.dto.collection.UpdateCollectionDto;
import com.crimecat.backend.userPost.repository.collection.CollectionRepository;
import com.crimecat.backend.userPost.repository.saved.SavedPostRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {
    
    private final CollectionRepository collectionRepository;
    private final SavedPostRepository savedPostRepository;
    
    /**
     * 컬렉션 생성
     */
    @Transactional
    public CollectionDto createCollection(WebUser user, CreateCollectionDto createDto) {
        createDto.validate();
        
        // 중복 이름 체크
        if (collectionRepository.findByUserIdAndName(user.getId(), createDto.getName()).isPresent()) {
            throw new DataIntegrityViolationException("이미 존재하는 컬렉션 이름입니다: " + createDto.getName());
        }
        
        Collection collection = Collection.create(
            user, 
            createDto.getName(), 
            createDto.getDescription(), 
            createDto.getIsPrivate()
        );
        
        Collection savedCollection = collectionRepository.save(collection);
        return CollectionDto.from(savedCollection, 0L, null);
    }
    
    /**
     * 사용자의 모든 컬렉션 조회 (게시물 수와 썸네일 포함)
     */
    public List<CollectionDto> getUserCollections(UUID userId) {
        List<Object[]> results = collectionRepository.findCollectionsWithPostCount(userId);
        
        return results.stream()
                .map(result -> {
                    Collection collection = (Collection) result[0];
                    Long postCount = (Long) result[1];
                    
                    // 썸네일 조회
                    String thumbnailUrl = collectionRepository
                            .findThumbnailByCollectionNameAndUserId(collection.getName(), userId)
                            .map(images -> {
                                // images는 JSON 배열 형태 문자열이므로 첫 번째 이미지 URL 추출
                                if (images.startsWith("[") && images.contains("\"")) {
                                    try {
                                        String firstImage = images.substring(2, images.indexOf("\","));
                                        return firstImage;
                                    } catch (Exception e) {
                                        return null;
                                    }
                                }
                                return null;
                            })
                            .orElse(null);
                    
                    return CollectionDto.from(collection, postCount, thumbnailUrl);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 컬렉션 조회
     */
    public CollectionDto getCollection(UUID collectionId, UUID userId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new EntityNotFoundException("컬렉션을 찾을 수 없습니다: " + collectionId));
        
        // 권한 체크
        if (!collection.isOwnedBy(new WebUser() {{ setId(userId); }})) {
            throw new IllegalArgumentException("컬렉션에 접근할 권한이 없습니다.");
        }
        
        // 게시물 수 조회
        Long postCount = savedPostRepository.countByUserIdAndCollectionName(userId, collection.getName());
        
        // 썸네일 조회
        String thumbnailUrl = collectionRepository
                .findThumbnailByCollectionNameAndUserId(collection.getName(), userId)
                .orElse(null);
        
        return CollectionDto.from(collection, postCount, thumbnailUrl);
    }
    
    /**
     * 컬렉션 정보 수정
     */
    @Transactional
    public CollectionDto updateCollection(UUID collectionId, UUID userId, UpdateCollectionDto updateDto) {
        updateDto.validate();
        
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new EntityNotFoundException("컬렉션을 찾을 수 없습니다: " + collectionId));
        
        // 권한 체크
        if (!collection.isOwnedBy(new WebUser() {{ setId(userId); }})) {
            throw new IllegalArgumentException("컬렉션을 수정할 권한이 없습니다.");
        }
        
        // 이름 변경 시 중복 체크
        if (updateDto.getName() != null && !updateDto.getName().equals(collection.getName())) {
            if (collectionRepository.findByUserIdAndName(userId, updateDto.getName()).isPresent()) {
                throw new DataIntegrityViolationException("이미 존재하는 컬렉션 이름입니다: " + updateDto.getName());
            }
            
            // SavedPost의 collectionName도 함께 업데이트
            savedPostRepository.updateCollectionName(userId, collection.getName(), updateDto.getName());
        }
        
        collection.updateInfo(updateDto.getName(), updateDto.getDescription(), updateDto.getIsPrivate());
        Collection savedCollection = collectionRepository.save(collection);
        
        // 게시물 수 조회
        Long postCount = savedPostRepository.countByUserIdAndCollectionName(userId, savedCollection.getName());
        
        return CollectionDto.from(savedCollection, postCount, null);
    }
    
    /**
     * 컬렉션 삭제
     */
    @Transactional
    public void deleteCollection(UUID collectionId, UUID userId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new EntityNotFoundException("컬렉션을 찾을 수 없습니다: " + collectionId));
        
        // 권한 체크
        if (!collection.isOwnedBy(new WebUser() {{ setId(userId); }})) {
            throw new IllegalArgumentException("컬렉션을 삭제할 권한이 없습니다.");
        }
        
        // 해당 컬렉션의 SavedPost들의 collectionName을 null로 변경
        savedPostRepository.removeCollectionName(userId, collection.getName());
        
        // 컬렉션 삭제
        collectionRepository.delete(collection);
    }
    
    /**
     * 컬렉션 이름으로 컬렉션 조회 (SavedPost 서비스에서 사용)
     */
    public Collection getCollectionByName(UUID userId, String collectionName) {
        return collectionRepository.findByUserIdAndName(userId, collectionName)
                .orElse(null);
    }
    
    /**
     * 컬렉션이 존재하지 않으면 자동 생성 (SavedPost 저장 시 사용)
     */
    @Transactional
    public Collection getOrCreateCollection(WebUser user, String collectionName) {
        return collectionRepository.findByUserIdAndName(user.getId(), collectionName)
                .orElseGet(() -> {
                    Collection newCollection = Collection.create(user, collectionName, null, false);
                    return collectionRepository.save(newCollection);
                });
    }
}