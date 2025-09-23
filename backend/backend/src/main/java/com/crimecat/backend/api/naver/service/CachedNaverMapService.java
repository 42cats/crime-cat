package com.crimecat.backend.api.naver.service;

import com.crimecat.backend.api.naver.api.NaverMapApi;
import com.crimecat.backend.api.naver.dto.CoordinateInfo;
import com.crimecat.backend.config.CacheType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
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
    @Cacheable(value = CacheType.NAVER_LOCAL_SEARCH, key = "#query + ':' + #display", cacheManager = "redisCacheManager")
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
    @CacheEvict(value = CacheType.NAVER_LOCAL_SEARCH, key = "#query + ':' + #display", cacheManager = "redisCacheManager")
    public void evictSearchCache(String query, int display) {
        log.info("네이버 검색 캐시 무효화 - query: {}, display: {}", query, display);
    }
    
    /**
     * 모든 네이버 검색 캐시 무효화
     */
    @CacheEvict(value = CacheType.NAVER_LOCAL_SEARCH, allEntries = true, cacheManager = "redisCacheManager")
    public void evictAllSearchCache() {
        log.info("네이버 검색 캐시 전체 무효화");
    }
    
    /**
     * 주소로부터 좌표 정보를 추출
     * 네이버 지역검색 API 결과에서 첫 번째 결과의 좌표를 반환
     * 
     * @param address 검색할 주소
     * @return 좌표 정보 (WGS84)
     * @throws RuntimeException 주소를 찾을 수 없는 경우
     */
    public CoordinateInfo getCoordinatesFromAddress(String address) {
        log.info("주소로부터 좌표 추출: {}", address);
        
        try {
            Map<String, Object> searchResult = searchLocal(address, 1);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) searchResult.get("items");
            
            if (items == null || items.isEmpty()) {
                throw new RuntimeException("주소를 찾을 수 없습니다: " + address);
            }
            
            Map<String, Object> firstItem = items.get(0);
            
            // 네이버 검색 API는 KATEC 좌표계를 사용하므로 WGS84로 변환
            String mapx = (String) firstItem.get("mapx"); // 경도 (x축)
            String mapy = (String) firstItem.get("mapy"); // 위도 (y축)
            
            if (mapx == null || mapy == null) {
                throw new RuntimeException("좌표 정보를 찾을 수 없습니다: " + address);
            }
            
            // KATEC 좌표를 WGS84로 변환
            CoordinateInfo coordinates = convertKatecToWgs84(Double.parseDouble(mapx), Double.parseDouble(mapy));
            
            log.info("좌표 추출 성공: {} -> lat={}, lng={}", address, coordinates.getLat(), coordinates.getLng());
            return coordinates;
            
        } catch (Exception e) {
            log.error("좌표 추출 실패: {}", address, e);
            throw new RuntimeException("좌표 추출 실패: " + address, e);
        }
    }
    
    /**
     * KATEC 좌표계를 WGS84 좌표계로 변환
     * 네이버 지도 API에서 반환되는 좌표는 KATEC 좌표계이므로 일반적인 위경도로 변환
     * 
     * @param katecX KATEC X 좌표 (경도)
     * @param katecY KATEC Y 좌표 (위도) 
     * @return WGS84 좌표 정보
     */
    private CoordinateInfo convertKatecToWgs84(double katecX, double katecY) {
        // 네이버 지도 좌표계 변환 공식
        // 실제로는 네이버에서 제공하는 좌표가 이미 WGS84에 가깝게 변환되어 있음
        // mapx, mapy를 100만으로 나누면 대략적인 위경도가 됨
        
        double lng = katecX / 10000000.0; // 경도
        double lat = katecY / 10000000.0; // 위도
        
        // 좌표 범위 검증 (대한민국 영역)
        if (lat < 33.0 || lat > 43.0 || lng < 124.0 || lng > 132.0) {
            log.warn("비정상적인 좌표 범위: lat={}, lng={}", lat, lng);
        }
        
        return CoordinateInfo.of(lat, lng);
    }
}