package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.MakerTeam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
@Builder
public class TeamDto {
    private UUID id;
    private String name;

    public static TeamDto from(MakerTeam makerTeam) {
        return TeamDto.builder()
                .id(makerTeam.getId())
                .name(makerTeam.getName())
                .build();
    }
}
