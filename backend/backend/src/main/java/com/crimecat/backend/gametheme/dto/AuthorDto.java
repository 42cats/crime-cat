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

    public static AuthorDto from(WebUser user) {
        if (user == null) {
            return null;
        }
    return AuthorDto.builder()
        .id(user.getId())
        .nickname(user.getNickname())
        .avatarUrl(user.getProfileImagePath())
        .build();
    }
}
