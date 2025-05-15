package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Set;

@AllArgsConstructor
@Getter
@Builder
public class DeleteMembersResponse {
    private Set<String> failed;
}
