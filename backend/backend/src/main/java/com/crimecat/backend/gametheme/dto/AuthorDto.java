package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.webUser.domain.WebUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorDto {
    private UUID id;
    private String nickname;
    private String avatarUrl;

    public static AuthorDto from(WebUser webUser) {
        if (webUser == null) {
            return null;
        }
        try {
            return AuthorDto.builder()
                .id(webUser.getId())
                .nickname(webUser.getNickname())
                .avatarUrl(webUser.getProfileImagePath())
                .build();
        } catch (Exception e) {
            // WebUser가 데이터베이스에 없는 경우 처리
            return null;
        }
    }
}
