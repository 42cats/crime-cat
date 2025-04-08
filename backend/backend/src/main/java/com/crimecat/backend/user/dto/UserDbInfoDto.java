package com.crimecat.backend.user.dto;

import com.crimecat.backend.user.domain.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class UserDbInfoDto {

    private UUID id;
    private String snowflake;
    private String name;
    private String avatar;
    private boolean discordAlarm;
    private Integer point;
    private LocalDateTime createdAt;
    private boolean isWithdraw;

    public static UserDbInfoDto from(User user) {
        return UserDbInfoDto.builder()
                .id(user.getId())
                .snowflake(user.getSnowflake())
                .name(user.getName())
                .avatar(user.getAvatar())
                .discordAlarm(user.isDiscordAlarm())
                .point(user.getPoint())
                .createdAt(user.getCreatedAt())
                .isWithdraw(user.isWithdraw())
                .build();
    }
}
