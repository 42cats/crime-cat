package com.crimecat.backend.web.gametheme.dto;

import lombok.Getter;

import java.util.Set;

@Getter
public class AddMemberRequest {
    private Set<MemberRequestDto> members;

    public void validate() {
        members.forEach(MemberRequestDto::validate);
    }
}
