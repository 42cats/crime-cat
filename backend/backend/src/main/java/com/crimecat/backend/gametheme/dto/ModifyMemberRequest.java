package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ModifyMemberRequest {
    private List<String> members;
}
