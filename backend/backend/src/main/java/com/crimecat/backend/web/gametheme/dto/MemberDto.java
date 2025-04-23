package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.MakerTeamMember;
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

    public static MemberDto from(MakerTeamMember member) {
        MemberDtoBuilder builder = MemberDto.builder().id(member.getId()).name(member.getName());
        if (member.getUserId() != null) {
            builder.userId(member.getUserId());
        }
        return builder.build();
    }
}
