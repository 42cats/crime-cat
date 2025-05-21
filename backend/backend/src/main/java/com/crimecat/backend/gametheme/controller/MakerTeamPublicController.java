package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.GetTeamResponse;
import com.crimecat.backend.gametheme.dto.GetTeamsResponse;
import com.crimecat.backend.gametheme.service.MakerTeamService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/teams")
public class MakerTeamPublicController {
    private final MakerTeamService makerTeamService;


    @GetMapping
    public GetTeamsResponse getTeams() {
        return makerTeamService.get();
    }

    @GetMapping("/{teamId}/with-avatars")
    public GetTeamResponse getTeamWithAvatars(@PathVariable UUID teamId) {
        return makerTeamService.getWithAvatars(teamId);
    }
}
