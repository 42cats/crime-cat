package com.crimecat.backend.api.discord;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.dto.web.ApiGetGuildInfoDto;
import com.crimecat.backend.guild.dto.web.ChannelDto;
import com.crimecat.backend.guild.dto.bot.RoleDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Discord API 호출을 캐싱하는 서비스
 * 실제 API 호출을 최소화하여 성능 향상 및 Rate Limit 방지
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CachedDiscordBotService {
    
    private final DiscordBotApi discordBotApi;
    
    /**
     * 길드 정보 조회 (캐시 적용)
     * TTL: 30분
     * @param guildSnowflake 길드 ID
     * @return 길드 정보
     */
    @Cacheable(value = CacheType.DISCORD_GUILD_INFO, key = "#guildSnowflake", cacheManager = "redisCacheManager")
    public ApiGetGuildInfoDto getGuildInfo(String guildSnowflake) {
        log.info("Discord API 호출 - 길드 정보 조회: {}", guildSnowflake);
        try {
            return discordBotApi.getGuildInfo(guildSnowflake).block();
        } catch (Exception e) {
            log.error("Discord API 호출 실패 - 길드 정보: {}", guildSnowflake, e);
            throw ErrorStatus.DISCORD_API_ERROR.asDomainException();
        }
    }
    
    /**
     * 길드 채널 목록 조회 (캐시 적용)
     * TTL: 15분
     * @param guildSnowflake 길드 ID
     * @return 채널 목록
     */
    @Cacheable(value = CacheType.DISCORD_GUILD_CHANNELS, key = "#guildSnowflake", cacheManager = "redisCacheManager")
    public List<ChannelDto> getGuildChannels(String guildSnowflake) {
        log.info("Discord API 호출 - 채널 목록 조회: {}", guildSnowflake);
        try {
            return discordBotApi.getGuildChannels(guildSnowflake);
        } catch (Exception e) {
            log.error("Discord API 호출 실패 - 채널 목록: {}", guildSnowflake, e);
            throw ErrorStatus.DISCORD_API_ERROR.asDomainException();
        }
    }
    
    /**
     * 길드 역할 목록 조회 (캐시 적용)
     * TTL: 10분
     * @param guildSnowflake 길드 ID
     * @return 역할 목록
     */
    @Cacheable(value = CacheType.DISCORD_GUILD_ROLES, key = "#guildSnowflake", cacheManager = "redisCacheManager")
    public List<RoleDto> getGuildRoles(String guildSnowflake) {
        log.info("Discord API 호출 - 역할 목록 조회: {}", guildSnowflake);
        try {
            return discordBotApi.getGuildRoles(guildSnowflake);
        } catch (Exception e) {
            log.error("Discord API 호출 실패 - 역할 목록: {}", guildSnowflake, e);
            throw ErrorStatus.DISCORD_GUILD_ROLES_FETCH_FAILED.asDomainException();
        }
    }
    
    /**
     * 특정 길드의 캐시 무효화
     * @param guildSnowflake 길드 ID
     */
    @CacheEvict(value = {CacheType.DISCORD_GUILD_INFO, CacheType.DISCORD_GUILD_CHANNELS, CacheType.DISCORD_GUILD_ROLES}, key = "#guildSnowflake", cacheManager="redisCacheManager")
    public void evictGuildCache(String guildSnowflake) {
        log.info("Discord 캐시 무효화 - 길드: {}", guildSnowflake);
    }
    
    /**
     * 모든 Discord 캐시 무효화
     */
    @CacheEvict(value = {CacheType.DISCORD_GUILD_INFO, CacheType.DISCORD_GUILD_CHANNELS, CacheType.DISCORD_GUILD_ROLES}, allEntries = true, cacheManager="redisCacheManager")
    public void evictAllDiscordCache() {
        log.info("Discord 캐시 전체 무효화");
    }
}