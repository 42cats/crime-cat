package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.user.domain.User;
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

    public static AuthorDto from(User user) {
        if (user == null) {
            return null;
        }
        
        if (user.getWebUser() == null) {
            return AuthorDto.builder()
                .id(user.getId())
                .nickname(user.getName())
                .avatarUrl(null)
                .build();
        }
        
        return AuthorDto.builder()
            .id(user.getWebUser().getId())
            .nickname(user.getWebUser().getNickname())
            .avatarUrl(user.getWebUser().getProfileImagePath())
            .build();
    }
}
