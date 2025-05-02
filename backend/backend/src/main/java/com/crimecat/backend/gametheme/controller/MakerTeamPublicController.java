package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import com.crimecat.backend.gametheme.dto.GetGameThemesResponse;
import com.crimecat.backend.gametheme.dto.GetTeamsResponse;
import com.crimecat.backend.gametheme.service.GameThemeService;
import com.crimecat.backend.gametheme.service.MakerTeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/teams")
public class MakerTeamPublicController {
    private final MakerTeamService makerTeamService;


    @GetMapping
    public GetTeamsResponse getTeams() {
        return makerTeamService.get();
    }
}
