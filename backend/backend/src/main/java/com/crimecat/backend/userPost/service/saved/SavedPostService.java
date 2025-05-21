package com.crimecat.backend.userPost.service.saved;

import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.saved.SavedPost;
import com.crimecat.backend.userPost.repository.UserPostRepository;
import com.crimecat.backend.userPost.repository.saved.SavedPostRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SavedPostService {
    
    private final SavedPostRepository savedPostRepository;
    private final UserPostRepository userPostRepository;
    private final WebUserRepository webUserRepository;
    
    /**
     * 게시물 저장/저장 취소 토글
     */
    @Transactional
    public boolean toggleSavePost(UUID userId, UUID postId, String collectionName) {
        WebUser user = webUserRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with ID: " + postId));
        
        Optional<SavedPost> existingSave = savedPostRepository.findByUserIdAndPostId(userId, postId);
        
        if (existingSave.isPresent()) {
            // 이미 저장된 경우 - 삭제
            savedPostRepository.delete(existingSave.get());
            // 게시물의 인기도 점수 업데이트
            post.updatePopularityScore();
            userPostRepository.save(post);
            return false;
        } else {
            // 저장되지 않은 경우 - 새로 저장
            SavedPost savedPost = collectionName != null && !collectionName.isBlank()
                    ? SavedPost.from(user, post, collectionName)
                    : SavedPost.from(user, post);
            
            savedPostRepository.save(savedPost);
            
            // 게시물의 인기도 점수 업데이트
            post.updatePopularityScore();
            userPostRepository.save(post);
            
            return true;
        }
    }
    
    /**
     * 게시물이 저장되었는지 확인
     */
    public boolean isPostSaved(UUID userId, UUID postId) {
        return savedPostRepository.existsByUserIdAndPostId(userId, postId);
    }
    
    /**
     * 사용자가 저장한 모든 게시물 조회
     */
    public Page<SavedPost> getSavedPosts(UUID userId, Pageable pageable) {
        return savedPostRepository.findAllByUserId(userId, pageable);
    }
    
    /**
     * 특정 컬렉션에 저장된 게시물 조회
     */
    public Page<SavedPost> getSavedPostsByCollection(UUID userId, String collectionName, Pageable pageable) {
        return savedPostRepository.findAllByUserIdAndCollectionName(userId, collectionName, pageable);
    }
    
    /**
     * 사용자의 모든 컬렉션 이름 목록 조회
     */
    public List<String> getUserCollections(UUID userId) {
        return savedPostRepository.findAllCollectionNamesByUserId(userId);
    }
    
    /**
     * 저장된 게시물을 다른 컬렉션으로 이동
     */
    @Transactional
    public void moveToCollection(UUID userId, UUID postId, String newCollectionName) {
        SavedPost savedPost = savedPostRepository.findByUserIdAndPostId(userId, postId)
                .orElseThrow(() -> new EntityNotFoundException("Saved post not found"));
        
        savedPost.setCollectionName(newCollectionName);
        savedPostRepository.save(savedPost);
    }
    
    /**
     * 특정 게시물을 저장한 사용자 수 조회
     */
    public long countPostSaves(UUID postId) {
        return savedPostRepository.countByPostId(postId);
    }
}
