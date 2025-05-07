package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.webUser.domain.WebUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
@Builder
public class AuthorDto {
    private UUID id;
    private String nickname;

    public static AuthorDto from(WebUser user) {
        if (user == null) {
            return null;
        }
        return AuthorDto.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .build();
    }
}
