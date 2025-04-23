package com.crimecat.backend.web.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ModifyMemberRequest {
    private List<String> members;
}
