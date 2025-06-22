package com.crimecat.backend.guild.controller.bot;

import com.crimecat.backend.api.discord.CachedDiscordBotService;
import com.crimecat.backend.guild.dto.bot.MessageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Discord Bot용 캐시 무효화 컨트롤러
 * Discord 이벤트 감지 시 봇이 직접 호출하는 캐시 무효화 API
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/guilds/{guildSnowflake}/cache")
public class BotCacheController {

    private final CachedDiscordBotService cachedDiscordBotService;

    /**
     * 특정 길드의 채널 캐시를 무효화합니다
     * Discord 채널 생성/수정/삭제 이벤트 시 호출됩니다
     * 
     * @param guildSnowflake Discord 길드 ID
     * @param eventInfo 이벤트 정보 (선택사항)
     * @return 캐시 무효화 결과
     */
    @DeleteMapping("/channels")
    public ResponseEntity<MessageDto<String>> evictChannelCache(
            @PathVariable String guildSnowflake,
            @RequestBody(required = false) Map<String, Object> eventInfo) {
        
        log.info("🔄 [Bot API - 채널 캐시 무효화 요청] guildId={}", guildSnowflake);
        
        if (eventInfo != null) {
            log.debug("이벤트 정보: {}", eventInfo);
        }
        
        try {
            // 채널 캐시 무효화
            cachedDiscordBotService.evictGuildCache(guildSnowflake);
            
            String message = "채널 캐시가 성공적으로 무효화되었습니다.";
            log.info("✅ [Bot API - 채널 캐시 무효화 성공] guildId={}", guildSnowflake);
            
            return ResponseEntity.ok(new MessageDto<>(message, "success"));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 채널 캐시 무효화 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw new RuntimeException("채널 캐시 무효화 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 특정 길드의 역할 캐시를 무효화합니다
     * Discord 역할 생성/수정/삭제 이벤트 시 호출됩니다
     * 
     * @param guildSnowflake Discord 길드 ID
     * @param eventInfo 이벤트 정보 (선택사항)
     * @return 캐시 무효화 결과
     */
    @DeleteMapping("/roles")
    public ResponseEntity<MessageDto<String>> evictRoleCache(
            @PathVariable String guildSnowflake,
            @RequestBody(required = false) Map<String, Object> eventInfo) {
        
        log.info("🔄 [Bot API - 역할 캐시 무효화 요청] guildId={}", guildSnowflake);
        
        if (eventInfo != null) {
            log.debug("이벤트 정보: {}", eventInfo);
        }
        
        try {
            // 역할 캐시 무효화
            cachedDiscordBotService.evictGuildCache(guildSnowflake);
            
            String message = "역할 캐시가 성공적으로 무효화되었습니다.";
            log.info("✅ [Bot API - 역할 캐시 무효화 성공] guildId={}", guildSnowflake);
            
            return ResponseEntity.ok(new MessageDto<>(message, "success"));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 역할 캐시 무효화 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw new RuntimeException("역할 캐시 무효화 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 특정 길드의 모든 캐시를 무효화합니다
     * 길드 정보, 채널, 역할 캐시를 모두 무효화합니다
     * 
     * @param guildSnowflake Discord 길드 ID
     * @param eventInfo 이벤트 정보 (선택사항)
     * @return 캐시 무효화 결과
     */
    @DeleteMapping("/all")
    public ResponseEntity<MessageDto<String>> evictAllGuildCache(
            @PathVariable String guildSnowflake,
            @RequestBody(required = false) Map<String, Object> eventInfo) {
        
        log.info("🔄 [Bot API - 길드 전체 캐시 무효화 요청] guildId={}", guildSnowflake);
        
        if (eventInfo != null) {
            log.debug("이벤트 정보: {}", eventInfo);
        }
        
        try {
            // 해당 길드의 모든 캐시 무효화
            cachedDiscordBotService.evictGuildCache(guildSnowflake);
            
            String message = "길드의 모든 캐시가 성공적으로 무효화되었습니다.";
            log.info("✅ [Bot API - 길드 전체 캐시 무효화 성공] guildId={}", guildSnowflake);
            
            return ResponseEntity.ok(new MessageDto<>(message, "success"));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 길드 전체 캐시 무효화 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw new RuntimeException("길드 전체 캐시 무효화 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 캐시 상태를 조회합니다 (디버깅 목적)
     * 
     * @param guildSnowflake Discord 길드 ID
     * @return 캐시 상태 정보
     */
    @GetMapping("/status")
    public ResponseEntity<MessageDto<Map<String, Object>>> getCacheStatus(@PathVariable String guildSnowflake) {
        log.info("📊 [Bot API - 캐시 상태 조회] guildId={}", guildSnowflake);
        
        try {
            // 현재는 간단한 상태만 반환, 필요 시 확장 가능
            Map<String, Object> status = Map.of(
                "guildId", guildSnowflake,
                "timestamp", System.currentTimeMillis(),
                "cacheService", "CachedDiscordBotService",
                "status", "active"
            );
            
            return ResponseEntity.ok(new MessageDto<>("캐시 상태 조회 성공", status));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 캐시 상태 조회 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw new RuntimeException("캐시 상태 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 수동 캐시 새로고침 (강제 업데이트)
     * 캐시를 무효화하고 새로운 데이터로 즉시 갱신합니다
     * 
     * @param guildSnowflake Discord 길드 ID
     * @param cacheType 갱신할 캐시 타입 ("channels", "roles", "all")
     * @return 캐시 갱신 결과
     */
    @PostMapping("/refresh")
    public ResponseEntity<MessageDto<String>> refreshCache(
            @PathVariable String guildSnowflake,
            @RequestParam(defaultValue = "all") String cacheType) {
        
        log.info("🔄 [Bot API - 수동 캐시 갱신] guildId={}, type={}", guildSnowflake, cacheType);
        
        try {
            // 현재 캐시 무효화
            cachedDiscordBotService.evictGuildCache(guildSnowflake);
            
            // 새로운 데이터 미리 로드 (선택사항)
            switch (cacheType.toLowerCase()) {
                case "channels":
                    // 채널 데이터 미리 로드
                    cachedDiscordBotService.getGuildChannels(guildSnowflake);
                    break;
                case "roles":
                    // 역할 데이터 미리 로드
                    cachedDiscordBotService.getGuildRoles(guildSnowflake);
                    break;
                case "all":
                default:
                    // 모든 데이터 미리 로드
                    cachedDiscordBotService.getGuildChannels(guildSnowflake);
                    cachedDiscordBotService.getGuildRoles(guildSnowflake);
                    break;
            }
            
            String message = String.format("%s 캐시가 성공적으로 갱신되었습니다.", cacheType);
            log.info("✅ [Bot API - 수동 캐시 갱신 성공] guildId={}, type={}", guildSnowflake, cacheType);
            
            return ResponseEntity.ok(new MessageDto<>(message, "success"));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 수동 캐시 갱신 실패] guildId={}, type={}, error={}", 
                     guildSnowflake, cacheType, e.getMessage(), e);
            throw new RuntimeException("수동 캐시 갱신 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}