package com.crimecat.backend.gametheme.dto;

import lombok.Getter;

import java.util.HashSet;
import java.util.Set;

@Getter
public class AddMemberRequest {
    private Set<MemberRequestDto> members = new HashSet<>();

    public void validate() {
        members.forEach(MemberRequestDto::validate);
    }
}
