package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class MemberDto {
    private UUID id;
    private UUID userId;
    private String name;
    private boolean isLeader;

    public static MemberDto from(MakerTeamMember member) {
        return MemberDto.builder()
                .id(member.getId())
                .name(member.getName())
                .isLeader(member.isLeader())
                .userId(member.getWebUserId())
                .build();
    }
}
