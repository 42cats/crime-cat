package com.crimecat.backend.web.gametheme.controller;

import com.crimecat.backend.web.gametheme.dto.*;
import com.crimecat.backend.web.gametheme.service.MakerTeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/teams")
public class MakerTeamController {
    private final MakerTeamService makerTeamService;

    @PostMapping
    public void createTeam(@Valid @RequestBody CreateTeamRequest createTeamRequest) {
        // TODO: 만들 때 권한 확인 / 제한 두기
        makerTeamService.create(createTeamRequest.getName());
    }

    @GetMapping
    public GetTeamsResponse getTeams() {
        return makerTeamService.get();
    }

    @GetMapping("/{teamId}")
    public GetTeamResponse getTeam(@PathVariable UUID teamId) {
        return makerTeamService.get(teamId);
    }

    @DeleteMapping("/{teamId}")
    public void deleteTeam(@PathVariable UUID teamId) {
        makerTeamService.delete(teamId);
    }

    @PostMapping("/{teamId}/members")
    public void addTeamMembers(@PathVariable UUID teamId, @RequestBody AddMemberRequest request) {
        request.validate();
        makerTeamService.addMembers(teamId, request.getMembers());
    }

    @PatchMapping("/{teamId}/members")
    public void deleteTeamMembers(@PathVariable UUID teamId, @RequestBody ModifyMemberRequest request) {
        makerTeamService.deleteMembers(teamId, request.getMembers());
    }

    @GetMapping("/me")
    public GetTeamsResponse getMyTeams() {
        return makerTeamService.getMyTeams();
    }
}
