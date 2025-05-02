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
        MemberDtoBuilder builder = MemberDto.builder().id(member.getId()).name(member.getName());
        if (member.getWebUserId() != null) {
            builder.userId(member.getWebUserId());
        }
        return builder.build();
    }
}
