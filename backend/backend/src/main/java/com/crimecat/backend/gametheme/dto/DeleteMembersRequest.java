package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DeleteMembersRequest {
    private Set<String> members;
}
