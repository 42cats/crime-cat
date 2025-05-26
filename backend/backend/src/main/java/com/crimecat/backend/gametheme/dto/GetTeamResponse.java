package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class GetTeamResponse {
    private UUID id;
    private String name;
    private List<MemberDto> members;
}
