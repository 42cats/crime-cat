package com.crimecat.backend.guild.dto.web;

import lombok.Data;

/**
 * 길드 채널 정보 DTO
 * 프론트엔드로 전송되는 채널 정보를 담습니다
 */
@Data
public class ChannelDto {
    /**
     * 채널 ID (snowflake)
     */
    private String id;
    
    /**
     * 채널 이름
     */
    private String name;
    
    /**
     * Discord API 채널 타입 번호
     */
    private Integer type;
    
    /**
     * 프론트엔드용 채널 타입 키 (text, voice, category 등)
     */
    private String typeKey;
    
    /**
     * 사용자 친화적 타입명 (텍스트 채널, 음성 채널 등)
     */
    private String displayName;
    
    /**
     * UI 표시용 이모지
     */
    private String emoji;
    
    /**
     * 채널 정렬 순서
     */
    private Integer position;
    
    /**
     * 부모 카테고리 ID (snowflake)
     */
    private String parentId;
    
    /**
     * 채널 주제 (선택적)
     */
    private String topic;
    
    /**
     * NSFW 여부 (선택적)
     */
    private Boolean nsfw;
}
