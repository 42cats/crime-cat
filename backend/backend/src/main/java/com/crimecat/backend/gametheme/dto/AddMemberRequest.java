package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequest {
    private Set<MemberRequestDto> members = new HashSet<>();

    public void validate() {
        members.forEach(MemberRequestDto::validate);
    }
}
