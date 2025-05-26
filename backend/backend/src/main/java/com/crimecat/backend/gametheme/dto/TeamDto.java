package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.MakerTeam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TeamDto {
    private UUID id;
    private String name;
    private Integer count;

    public static TeamDto from(MakerTeam makerTeam) {
        if (makerTeam == null) {
            return null;
        }
        return TeamDto.builder()
                .id(makerTeam.getId())
                .name(makerTeam.getName())
                .count(makerTeam.getMembers().size())
                .build();
    }
}
