package com.crimecat.backend.guild.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

/**
 * Discord 채널 타입 정의
 * Discord API 공식 채널 타입에 기반함
 */
@Getter
@RequiredArgsConstructor
public enum ChannelType {
    GUILD_TEXT(0, "text", "텍스트 채널", "💬"),
    GUILD_VOICE(2, "voice", "음성 채널", "🔊"),
    GUILD_CATEGORY(4, "category", "카테고리", "📁"),
    GUILD_ANNOUNCEMENT(5, "announcement", "공지 채널", "📢"),
    GUILD_STAGE_VOICE(13, "stage", "스테이지 채널", "🎤"),
    GUILD_FORUM(15, "forum", "포럼 채널", "💭"),
    GUILD_MEDIA(16, "media", "미디어 채널", "🖼️"),
    UNKNOWN(-1, "unknown", "알 수 없음", "❓");
    
    private final int typeId;
    private final String typeKey;
    private final String displayName;
    private final String emoji;
    
    /**
     * Discord API 타입 ID로부터 ChannelType을 찾습니다
     * @param typeId Discord API 채널 타입 ID
     * @return 해당하는 ChannelType, 없으면 UNKNOWN
     */
    public static ChannelType fromTypeId(int typeId) {
        return Arrays.stream(values())
            .filter(type -> type.typeId == typeId)
            .findFirst()
            .orElse(UNKNOWN);
    }
    
    /**
     * 텍스트 기반 채널인지 확인
     * @return 텍스트 기반 채널이면 true
     */
    public boolean isTextBased() {
        return this == GUILD_TEXT || this == GUILD_ANNOUNCEMENT || 
               this == GUILD_FORUM || this == GUILD_MEDIA;
    }
    
    /**
     * 음성 기반 채널인지 확인
     * @return 음성 기반 채널이면 true
     */
    public boolean isVoiceBased() {
        return this == GUILD_VOICE || this == GUILD_STAGE_VOICE;
    }
    
    /**
     * 카테고리 채널인지 확인
     * @return 카테고리 채널이면 true
     */
    public boolean isCategory() {
        return this == GUILD_CATEGORY;
    }
}