package com.crimecat.backend.guild.dto.web;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Discord API /guilds/{guild.id}/channels 응답 DTO
 * Discord API에서 반환하는 채널 정보를 매핑합니다
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DiscordChannelResponse {
    /**
     * 채널 ID (snowflake)
     */
    private String id;
    
    /**
     * 채널 이름
     */
    private String name;
    
    /**
     * 채널 타입 (Discord API 표준)
     */
    private Integer type;
    
    /**
     * 채널 정렬 순서
     */
    private Integer position;
    
    /**
     * 부모 카테고리 ID (snowflake)
     */
    @JsonProperty("parent_id")
    private String parentId;
    
    /**
     * 채널 주제 (텍스트 채널용)
     */
    private String topic;
    
    /**
     * NSFW 여부
     */
    private Boolean nsfw;
    
    /**
     * 비트레이트 (음성 채널용)
     */
    private Integer bitrate;
    
    /**
     * 사용자 제한 (음성 채널용)
     */
    @JsonProperty("user_limit")
    private Integer userLimit;
    
    /**
     * 메시지 속도 제한 (초)
     */
    @JsonProperty("rate_limit_per_user")
    private Integer rateLimitPerUser;
}