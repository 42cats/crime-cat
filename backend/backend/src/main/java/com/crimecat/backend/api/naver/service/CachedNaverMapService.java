package com.crimecat.backend.api.naver.service;

import com.crimecat.backend.api.naver.api.NaverMapApi;
import com.crimecat.backend.config.CacheType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * 네이버 API 호출을 캐싱하는 서비스
 * 동일한 검색어에 대한 반복 호출을 방지하여 API 사용량 절감
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CachedNaverMapService {
    
    private final NaverMapApi naverMapApi;
    
    /**
     * 지역 검색 (캐시 적용)
     * TTL: 1시간
     * @param query 검색어
     * @param display 표시할 결과 수
     * @return 검색 결과
     */
    @Cacheable(value = CacheType.NAVER_LOCAL_SEARCH, key = "#query + ':' + #display")
    public Map searchLocal(String query, int display) {
        log.info("네이버 API 호출 - 지역 검색: query={}, display={}", query, display);
        try {
            return naverMapApi.searchLocal(query, display).block();
        } catch (Exception e) {
            log.error("네이버 API 호출 실패 - 지역 검색: query={}", query, e);
            throw new RuntimeException("네이버 API 호출 실패", e);
        }
    }
    
    /**
     * 특정 검색어의 캐시 무효화
     * @param query 검색어
     * @param display 표시할 결과 수
     */
    @CacheEvict(value = CacheType.NAVER_LOCAL_SEARCH, key = "#query + ':' + #display")
    public void evictSearchCache(String query, int display) {
        log.info("네이버 검색 캐시 무효화 - query: {}, display: {}", query, display);
    }
    
    /**
     * 모든 네이버 검색 캐시 무효화
     */
    @CacheEvict(value = CacheType.NAVER_LOCAL_SEARCH, allEntries = true)
    public void evictAllSearchCache() {
        log.info("네이버 검색 캐시 전체 무효화");
    }
}