package com.crimecat.backend.web.gametheme.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class AddMemberRequest {
    private List<MemberRequestDto> members;

    public void validate() {
        members.forEach(MemberRequestDto::validate);
    }
}
