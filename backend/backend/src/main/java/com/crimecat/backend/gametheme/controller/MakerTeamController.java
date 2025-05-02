package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.dto.AddMemberRequest;
import com.crimecat.backend.gametheme.dto.CreateTeamRequest;
import com.crimecat.backend.gametheme.dto.GetTeamResponse;
import com.crimecat.backend.gametheme.dto.GetTeamsResponse;
import com.crimecat.backend.gametheme.dto.ModifyMemberRequest;
import com.crimecat.backend.gametheme.service.MakerTeamService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
