package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.repository.ThemeAdvertisementRequestRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
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
public class DiscordBotCacheService {
    
    private final StringRedisTemplate redisTemplate;
    private final RedisTemplate<String, Object> redisPublisherTemplate;
    private final ThemeAdvertisementRequestRepository requestRepository;
    private final ObjectMapper objectMapper;
    
    private static final String DISCORD_BOT_ACTIVE_ADS_KEY = "theme:ad:active";
    private static final String ADVERTISEMENT_CHANNEL = "advertisement:active:changed";
    private static final Duration CACHE_TTL = Duration.ofHours(3); // 1시간 TTL
    
    public DiscordBotCacheService(
            StringRedisTemplate redisTemplate,
            @Qualifier("redisPublisherTemplate") RedisTemplate<String, Object> redisPublisherTemplate,
            ThemeAdvertisementRequestRepository requestRepository,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.redisPublisherTemplate = redisPublisherTemplate;
        this.requestRepository = requestRepository;
        this.objectMapper = objectMapper;
    }
    
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
                
                // 🚀 빈 배열도 Pub/Sub 이벤트 발행 (광고 전체 삭제 알림)
                publishAdvertisementUpdate(List.of());
                
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
            
            // 🚀 Redis Pub/Sub으로 광고 변경 이벤트 발행
            publishAdvertisementUpdate(botFriendlyData);
            
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
            
            // 🚀 캐시 삭제 시에도 Pub/Sub 이벤트 발행 (빈 배열)
            publishAdvertisementUpdate(List.of());
            
            log.info("디스코드 봇용 활성 광고 캐시 삭제 완료");
        } catch (Exception e) {
            log.error("활성 광고 캐시 삭제 중 오류 발생", e);
        }
    }
    
    /**
     * 🚀 Redis Pub/Sub으로 광고 변경 시그널 발행 (최적화된 버전)
     * Discord Bot에게 광고 데이터 변경을 실시간으로 알림
     *
     * 성능 개선:
     * - 메시지 크기: 200-500 bytes → 7 bytes (95% 절약)
     * - 봇에서 Redis 직접 조회로 데이터 일관성 보장
     *
     * @param adsData 변경된 광고 데이터 목록 (크기 정보용)
     */
    private void publishAdvertisementUpdate(List<Map<String, Object>> adsData) {
        try {
            // 단순 시그널만 발행 (데이터는 Redis에서 조회)
            redisPublisherTemplate.convertAndSend(ADVERTISEMENT_CHANNEL, "UPDATED");

            log.info("📢 광고 변경 시그널 발행 완료: {} → {} 건의 활성 광고 (시그널 전송)",
                    ADVERTISEMENT_CHANNEL, adsData.size());

        } catch (Exception e) {
            log.error("❌ 광고 변경 시그널 발행 실패: {}", ADVERTISEMENT_CHANNEL, e);
            // Pub/Sub 실패는 캐시 업데이트를 방해하지 않도록 예외를 던지지 않음
        }
    }
    
    /**
     * 🔧 수동으로 광고 변경 이벤트 발행 (관리용)
     * 테스트나 수동 갱신 시 사용
     */
    public void manualPublishAdvertisementUpdate() {
        log.info("🔧 수동 광고 이벤트 발행 시작");
        updateActiveAdvertisementsCache();
    }
}