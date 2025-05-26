package com.crimecat.backend.webUser.dto;

import com.crimecat.backend.webUser.domain.WebUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserSearchResponseDto {
    private String id;
    private String nickname;
    private String discordUserSnowflake;

    /**
     * WebUser 엔티티에서 닉네임 검색 결과용 DTO 생성
     */
    public static UserSearchResponseDto fromForNickname(WebUser webUser) {
        return UserSearchResponseDto.builder()
                .id(webUser.getId().toString())
                .nickname(webUser.getNickname())
                .build();
    }

    /**
     * WebUser 엔티티에서 Discord Snowflake 검색 결과용 DTO 생성
     */
    public static UserSearchResponseDto fromForDiscordSnowflake(WebUser webUser) {
        return UserSearchResponseDto.builder()
                .id(webUser.getId().toString())
                .nickname(webUser.getNickname())
                .discordUserSnowflake(webUser.getDiscordUserSnowflake())
                .build();
    }
}
