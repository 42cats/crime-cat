package com.crimecat.backend.hashtag.service;

import com.crimecat.backend.hashtag.domain.HashTag;
import com.crimecat.backend.hashtag.domain.PostHashTag;
import com.crimecat.backend.hashtag.repository.HashTagRepository;
import com.crimecat.backend.hashtag.repository.PostHashTagRepository;
import com.crimecat.backend.userPost.domain.UserPost;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HashTagService {
    
    private final HashTagRepository hashTagRepository;
    private final PostHashTagRepository postHashTagRepository;
    
    // 해시태그 추출 정규식 패턴
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([\\p{L}\\p{N}_]+)");
    
    /**
     * 텍스트에서 해시태그(#으로 시작하는 단어) 추출
     */
    public Set<String> extractHashTags(String content) {
        if (content == null || content.isEmpty()) {
            return Collections.emptySet();
        }
        
        Set<String> hashTags = new HashSet<>();
        Matcher matcher = HASHTAG_PATTERN.matcher(content);
        
        while (matcher.find()) {
            // # 제외한 해시태그 텍스트만 추출
            hashTags.add(matcher.group(1).toLowerCase());
        }
        
        return hashTags;
    }
    
    /**
     * 해시태그 이름으로 해시태그 객체 조회 또는 생성
     */
    @Transactional
    public HashTag getOrCreateHashTag(String name) {
        return hashTagRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> hashTagRepository.save(HashTag.create(name)));
    }
    
    /**
     * 게시물에 해시태그 연결 (콘텐츠에서 자동 추출)
     */
    @Transactional
    public void processPostHashTags(UserPost post, String content) {
        // 기존 해시태그 연결 모두 삭제
        List<PostHashTag> existingTags = postHashTagRepository.findAllByPostId(post.getId());
        existingTags.forEach(PostHashTag::removeAssociations);
        postHashTagRepository.deleteAllByPostId(post.getId());
        
        // 새 해시태그 추출 및 연결
        Set<String> hashTagTexts = extractHashTags(content);
        for (String tagText : hashTagTexts) {
            HashTag hashTag = getOrCreateHashTag(tagText);
            PostHashTag postHashTag = PostHashTag.create(post, hashTag);
        }
    }
    
    /**
     * 게시물에 해시태그 연결 (명시적 태그 목록 사용)
     */
    @Transactional
    public void processPostHashTagsExplicit(UserPost post, List<String> hashtags) {
        // 기존 해시태그 연결 모두 삭제
        List<PostHashTag> existingTags = postHashTagRepository.findAllByPostId(post.getId());
        existingTags.forEach(PostHashTag::removeAssociations);
        postHashTagRepository.deleteAllByPostId(post.getId());
        
        // 명시적 해시태그 연결
        if (hashtags != null && !hashtags.isEmpty()) {
            for (String tagText : hashtags) {
                if (tagText != null && !tagText.trim().isEmpty()) {
                    String cleanTag = tagText.trim().toLowerCase();
                    // # 제거 (혹시 포함되어 있을 경우)
                    if (cleanTag.startsWith("#")) {
                        cleanTag = cleanTag.substring(1);
                    }
                    if (!cleanTag.isEmpty()) {
                        HashTag hashTag = getOrCreateHashTag(cleanTag);
                        PostHashTag postHashTag = PostHashTag.create(post, hashTag);
                    }
                }
            }
        }
    }
    
    /**
     * 게시물에 연결된 해시태그 목록 조회
     */
    public List<HashTag> getPostHashTags(UUID postId) {
        return hashTagRepository.findAllByPostId(postId);
    }
    
    /**
     * 게시물에 연결된 해시태그 이름 목록 조회
     */
    public List<String> getPostHashTagNames(UUID postId) {
        return hashTagRepository.findAllByPostId(postId)
                .stream()
                .map(HashTag::getName)
                .collect(Collectors.toList());
    }
    
    /**
     * 해시태그 검색 (자동완성용)
     */
    public Page<HashTag> searchHashTagsByName(String query, Pageable pageable) {
        return hashTagRepository.findByNameContainingIgnoreCase(query, pageable);
    }
    
    /**
     * 인기 해시태그 조회
     */
    public Page<HashTag> getPopularHashTags(Pageable pageable) {
        return hashTagRepository.findAllByOrderByUseCountDesc(pageable);
    }
    
    /**
     * 특정 해시태그들을 모두 포함하는 게시물 ID 목록 반환
     */
    public List<UUID> findPostsWithAllHashTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return Collections.emptyList();
        }
        
        // 태그명 소문자 변환
        List<String> normalizedTagNames = tagNames.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList());
        
        return hashTagRepository.findPostIdsWithAllHashTags(normalizedTagNames, normalizedTagNames.size());
    }
    
    /**
     * 특정 해시태그와 연결된 모든 PostHashTag 조회
     */
    public List<PostHashTag> getPostHashTagsByHashTag(UUID hashTagId) {
        return postHashTagRepository.findAllByHashTagId(hashTagId);
    }
}
