package com.crimecat.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 캐시 무효화 유틸리티 클래스
 * - Caffeine 캐시의 패턴 기반 무효화 지원
 * - 게시글/댓글 관련 캐시 관리 전용
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CacheInvalidationUtil {

    private final CacheManager caffeineCacheManager;

    /**
     * 특정 패턴으로 시작하는 캐시 키들을 무효화
     * @param cacheName 캐시 이름
     * @param keyPrefix 키 접두사 (예: "postId_")
     */
    @SuppressWarnings("unchecked")
    public void evictByKeyPrefix(String cacheName, String keyPrefix) {
        try {
            Cache cache = caffeineCacheManager.getCache(cacheName);
            if (cache != null) {
                com.github.benmanes.caffeine.cache.Cache<Object, Object> nativeCache =
                    (com.github.benmanes.caffeine.cache.Cache<Object, Object>) cache.getNativeCache();

                // 삭제할 키들을 먼저 수집
                java.util.List<Object> keysToRemove = nativeCache.asMap().keySet().stream()
                    .filter(key -> key.toString().startsWith(keyPrefix))
                    .collect(java.util.stream.Collectors.toList());

                // 수집된 키들을 삭제
                keysToRemove.forEach(nativeCache::invalidate);

                log.debug("🗑️ [CACHE] Evicted {} entries with prefix '{}' from cache '{}'",
                         keysToRemove.size(), keyPrefix, cacheName);
            }
        } catch (Exception e) {
            log.error("❌ [CACHE] Failed to evict cache with prefix '{}' from cache '{}': {}",
                     keyPrefix, cacheName, e.getMessage());
        }
    }

    /**
     * 특정 게시글과 관련된 모든 캐시 무효화
     * @param postId 게시글 ID
     */
    public void evictPostRelatedCaches(UUID postId) {
        log.debug("🗑️ [CACHE] Evicting all caches for post: {}", postId);

        String postPrefix = postId + "_";
        evictByKeyPrefix(CacheNames.BOARD_POST_DETAIL, postPrefix);
        evictByKeyPrefix(CacheNames.BOARD_POST_COMMENTS, postPrefix);

        // POST_NAVIGATION은 boardType별이므로 전체 무효화가 더 효율적
        evictAllEntries(CacheNames.POST_NAVIGATION);
    }

    /**
     * 특정 사용자의 특정 게시글 캐시만 무효화
     * @param postId 게시글 ID
     * @param userId 사용자 ID
     */
    public void evictUserSpecificCache(UUID postId, UUID userId) {
        log.debug("🗑️ [CACHE] Evicting user-specific cache for post: {}, user: {}", postId, userId);

        String userKey = postId + "_" + userId;
        evictSpecificKey(CacheNames.BOARD_POST_DETAIL, userKey);
        evictSpecificKey(CacheNames.BOARD_POST_COMMENTS, userKey);
    }

    /**
     * 특정 캐시 키 무효화
     * @param cacheName 캐시 이름
     * @param key 캐시 키
     */
    public void evictSpecificKey(String cacheName, String key) {
        try {
            Cache cache = caffeineCacheManager.getCache(cacheName);
            if (cache != null) {
                cache.evict(key);
                log.debug("🗑️ [CACHE] Evicted key '{}' from cache '{}'", key, cacheName);
            }
        } catch (Exception e) {
            log.error("❌ [CACHE] Failed to evict key '{}' from cache '{}': {}",
                     key, cacheName, e.getMessage());
        }
    }

    /**
     * 전체 캐시 무효화
     * @param cacheName 캐시 이름
     */
    public void evictAllEntries(String cacheName) {
        try {
            Cache cache = caffeineCacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                log.debug("🗑️ [CACHE] Cleared all entries from cache '{}'", cacheName);
            }
        } catch (Exception e) {
            log.error("❌ [CACHE] Failed to clear cache '{}': {}", cacheName, e.getMessage());
        }
    }

    /**
     * 댓글 관련 캐시 무효화 (특정 게시글의 모든 댓글 캐시)
     * @param postId 게시글 ID
     */
    public void evictPostCommentCaches(UUID postId) {
        log.debug("🗑️ [CACHE] Evicting comment caches for post: {}", postId);

        String postPrefix = postId + "_";
        evictByKeyPrefix(CacheNames.BOARD_POST_COMMENTS, postPrefix);
    }

    /**
     * 게시글 좋아요 관련 캐시 무효화 (특정 사용자의 특정 게시글만)
     * @param postId 게시글 ID
     * @param userId 사용자 ID
     */
    public void evictPostLikeCache(UUID postId, UUID userId) {
        log.debug("🗑️ [CACHE] Evicting post like cache for post: {}, user: {}", postId, userId);

        String userKey = postId + "_" + userId;
        evictSpecificKey(CacheNames.BOARD_POST_DETAIL, userKey);
    }

    /**
     * 댓글 좋아요 관련 캐시 무효화 (특정 사용자의 특정 게시글 댓글만)
     * @param postId 게시글 ID
     * @param userId 사용자 ID
     */
    public void evictCommentLikeCache(UUID postId, UUID userId) {
        log.debug("🗑️ [CACHE] Evicting comment like cache for post: {}, user: {}", postId, userId);

        String userKey = postId + "_" + userId;
        evictSpecificKey(CacheNames.BOARD_POST_COMMENTS, userKey);
    }
}