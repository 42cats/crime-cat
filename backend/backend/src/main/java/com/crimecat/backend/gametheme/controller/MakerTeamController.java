package com.crimecat.backend.gametheme.controller;

import com.crimecat.backend.gametheme.domain.MakerTeam;
import com.crimecat.backend.gametheme.dto.*;
import com.crimecat.backend.gametheme.service.MakerTeamService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.enums.UserRole;
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
    public TeamDto createTeam(@Valid @RequestBody CreateTeamRequest createTeamRequest) {
        // TODO: 만들 때 권한 확인 / 제한 두기
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.USER);
        UUID teamId = makerTeamService.create(createTeamRequest.getName());
        // 생성된 팀 정보 반환
        MakerTeam team = makerTeamService.getTeamById(teamId);
        return TeamDto.from(team);
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
    public DeleteMembersResponse deleteTeamMembers(@PathVariable UUID teamId, @RequestBody DeleteMembersRequest request) {
        return new DeleteMembersResponse(makerTeamService.deleteMembers(teamId, request.getMembers()));
    }

    @PutMapping("/{teamId}/members/{memberId}")
    public void updateTeamMember(@PathVariable UUID teamId, @PathVariable UUID memberId, @RequestBody UpdateMemberRequest request) {
        makerTeamService.updateMember(teamId, memberId, request);
    }

    @GetMapping("/me")
    public GetTeamsResponse getMyTeams() {
        GetTeamsResponse myTeams = makerTeamService.getMyTeams();
                return myTeams;
    }
}
