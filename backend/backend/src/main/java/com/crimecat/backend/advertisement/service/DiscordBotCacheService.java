package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.repository.ThemeAdvertisementRequestRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 디스코드 봇에서 사용할 수 있는 간단한 형태로 Redis 캐시를 관리하는 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiscordBotCacheService {
    
    private final StringRedisTemplate redisTemplate;
    private final ThemeAdvertisementRequestRepository requestRepository;
    private final ObjectMapper objectMapper;
    
    private static final String DISCORD_BOT_ACTIVE_ADS_KEY = "theme:ad:active";
    private static final Duration CACHE_TTL = Duration.ofHours(1); // 1시간 TTL
    
    /**
     * 디스코드 봇용 활성 광고 캐시 업데이트
     */
    public void updateActiveAdvertisementsCache() {
        try {
            List<ThemeAdvertisementRequest> activeAds = 
                requestRepository.findByStatusOrderByQueuePositionAsc(AdvertisementStatus.ACTIVE);
            
            // 활성 광고가 없는 경우에도 빈 배열을 저장
            if (activeAds.isEmpty()) {
                String emptyJsonArray = "[]";
                redisTemplate.opsForValue().set(DISCORD_BOT_ACTIVE_ADS_KEY, emptyJsonArray, CACHE_TTL);
                log.info("디스코드 봇용 활성 광고 캐시 업데이트 완료: 0 건 (빈 배열 저장)");
                return;
            }
            
            // 디스코드 봇에서 필요한 최소한의 정보만 추출
            List<Map<String, Object>> botFriendlyData = activeAds.stream()
                .map(ad -> {
                    Map<String, Object> adData = new HashMap<>();
                    adData.put("id", ad.getId().toString());
                    adData.put("themeName", ad.getThemeName());
                    adData.put("themeType", ad.getThemeType().toString());
                    return adData;
                })
                .toList();
            
            String jsonData = objectMapper.writeValueAsString(botFriendlyData);
            redisTemplate.opsForValue().set(DISCORD_BOT_ACTIVE_ADS_KEY, jsonData, CACHE_TTL);
            
            log.info("디스코드 봇용 활성 광고 캐시 업데이트 완료: {} 건", activeAds.size());
            
        } catch (JsonProcessingException e) {
            log.error("활성 광고 캐시 업데이트 중 JSON 처리 오류", e);
        } catch (Exception e) {
            log.error("활성 광고 캐시 업데이트 중 오류 발생", e);
        }
    }
    
    /**
     * 디스코드 봇용 활성 광고 캐시 삭제
     */
    public void clearActiveAdvertisementsCache() {
        try {
            redisTemplate.delete(DISCORD_BOT_ACTIVE_ADS_KEY);
            log.info("디스코드 봇용 활성 광고 캐시 삭제 완료");
        } catch (Exception e) {
            log.error("활성 광고 캐시 삭제 중 오류 발생", e);
        }
    }
}