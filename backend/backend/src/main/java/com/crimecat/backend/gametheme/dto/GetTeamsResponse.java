package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class GetTeamsResponse {
    private List<TeamDto> teams;
}
