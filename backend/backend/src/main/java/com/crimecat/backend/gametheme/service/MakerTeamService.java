package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gametheme.domain.MakerTeam;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.gametheme.dto.*;
import com.crimecat.backend.gametheme.repository.MakerTeamMemberRepository;
import com.crimecat.backend.gametheme.repository.MakerTeamRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MakerTeamService {
    private final MakerTeamRepository teamRepository;
    private final MakerTeamMemberRepository teamMemberRepository;
    private final WebUserRepository webUserRepository;

    public void create(String name) {
        create(name, AuthenticationUtil.getCurrentWebUser(), false);
    }

    @Transactional
    public UUID create(String name, WebUser leader, boolean isIndividual) {
        MakerTeam team = teamRepository.save(MakerTeam.builder()
                .name(name)
                .isIndividual(isIndividual)
                .build());
        teamMemberRepository.save(MakerTeamMember.builder()
                .webUser(leader)
                .name(leader.getUsername())
                .team(team)
                .isLeader(true)
                .build());
        return team.getId();
    }

    public GetTeamsResponse get() {
        return new GetTeamsResponse(teamRepository.findAll().stream()
                .map(TeamDto::from).toList());
    }

    public GetTeamResponse get(UUID teamId) {
        MakerTeam team = teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        return GetTeamResponse.builder()
                .id(teamId)
                .name(team.getName())
                .members(team.getMembers().stream()
                        .map(MemberDto::from)
                        .toList())
                .build();
    }

    @Transactional
    public GetTeamResponse getWithAvatars(UUID teamId) {
        MakerTeam team = teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        return GetTeamResponse.builder()
                .id(teamId)
                .name(team.getName())
                .members(team.getMembers().stream()
                        .map(member -> MemberDto.fromWithAvatar(member, webUserRepository))
                        .toList())
                .build();
    }

    public List<MakerTeamMember> getIndividualTeams(UUID leaderId) {
        List<MakerTeamMember> teams = teamMemberRepository.findByWebUserIdAndIsLeader(leaderId, true);
        return teams.stream().filter(v -> v.getTeam().isIndividual()).toList();
    }

    @Transactional
    public void delete(UUID teamId) {
        isTeamLeaderOrThrow(teamId);
        teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        teamRepository.deleteById(teamId);
    }

    @Transactional
    public void addMember(MakerTeam team, MemberRequestDto member) {
        MakerTeamMember.MakerTeamMemberBuilder builder = MakerTeamMember.builder().team(team);
        String name = member.getName();
        if (member.getUserId() != null) {
            // 유저 id 입력 시 유저 검색해서 삽입
            // TODO: 리스트 추가 시 에러 > exception 던질지 나머지는 처리할지
            WebUser webUser = webUserRepository.findById(member.getUserId())
                    .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
            builder.webUser(webUser);
            // 팀 멤버 이름 명시하지 않았고, 유저 존재할 때 유저 정보에서 이름 가져오기
            if (name == null) {
                name = webUser.getNickname();
            }
            // webUserId로 중복 유저 확인
            if (team.getMembers().stream().anyMatch(v -> webUser.getId().equals(v.getWebUser().getId()))) {
                // TODO: 리스트 추가 시 에러 > exception 던질지 나머지는 처리할지
                throw ErrorStatus.TEAM_MEMBER_ALREADY_REGISTERED.asServiceException();
            }
        }
        builder.name(name);
        teamMemberRepository.save(builder.build());
    }

    @Transactional
    public void addMembers(UUID teamId, Set<MemberRequestDto> members) {
        isTeamLeaderOrThrow(teamId);
        if (members.isEmpty()) {
            return;
        }
        MakerTeam team = teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        if (team.isIndividual()) {
            team.setIndividual(false);
        }
        for (MemberRequestDto m : members) {
            addMember(team, m);
        }
        teamRepository.save(team);
    }

    /**
     * 팀에서 멤버 삭제
     * @param teamId 멤버를 삭제할 팀
     * @param deletedMembers 삭제할 멤버 id(MakerTeamMember.id)를 담은 Set
     * @return 삭제에 실패한 멤버 id(MakerTeamMember.id) Set
     */
    @Transactional
    public Set<String> deleteMembers(UUID teamId, Set<String> deletedMembers) {
        if (deletedMembers.isEmpty()) {
            return deletedMembers;
        }
        MakerTeam team = teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        MakerTeamMember loginMember = teamMemberRepository.findByWebUserIdAndTeamId(webUserId, teamId).orElseThrow(ErrorStatus.FORBIDDEN::asServiceException);
        if (!loginMember.isLeader()) {
            if (deletedMembers.contains(loginMember.getId().toString())) {
                teamMemberRepository.delete(loginMember);
                deletedMembers.remove(loginMember.getId().toString());
            }
            return deletedMembers;
        }
        List<MakerTeamMember> members = team.getMembers();
        // 팀에 있는 리더 수 확인
        long leaderCount = members.stream().filter(MakerTeamMember::isLeader).count();
        
        for (MakerTeamMember member : members) {
            if (deletedMembers.contains(member.getId().toString())) {
                // 리더인 경우 처리
                if (member.isLeader()) {
                    // 리더가 2명 이상인 경우에만 삭제 허용
                    if (leaderCount > 1) {
                        teamMemberRepository.delete(member);
                        deletedMembers.remove(member.getId().toString());
                    }
                } else {
                    // 리더가 아닌 멤버는 그냥 삭제
                    teamMemberRepository.delete(member);
                    deletedMembers.remove(member.getId().toString());
                }
            }
        }
        return deletedMembers;
    }

    private void isTeamLeaderOrThrow(UUID teamId) {
        if (!isTeamLeader(teamId)) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
    }

    private boolean isTeamLeader(UUID teamId) {
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        MakerTeamMember makerTeamMember = teamMemberRepository.findByWebUserIdAndTeamId(webUserId, teamId)
                .orElseThrow(ErrorStatus.FORBIDDEN::asServiceException);
        return makerTeamMember.isLeader();
    }

    public GetTeamsResponse getMyTeams() {
        UUID webUserId = AuthenticationUtil.getCurrentWebUserId();
        return new GetTeamsResponse(
                teamMemberRepository.findByWebUserId(webUserId).stream()
                        .filter(v -> !v.getTeam().isIndividual()) // 개인 팀은 제외하고 조회
                        .map(v -> TeamDto.from(v.getTeam()))
                        .toList()
        );
    }
    @Transactional(readOnly = true)
    public List<UUID> getTargetTeams(UUID webUserId) {
        return teamMemberRepository.findByWebUserId(webUserId).stream()
                .map(v-> v.getTeam().getId())
                .toList();
    }
    @Transactional
    public void updateMember(UUID teamId, UUID memberId, UpdateMemberRequest updateInfo) {
        MakerTeam team = teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        MakerTeamMember member = teamMemberRepository.findById(memberId).orElseThrow(ErrorStatus.FORBIDDEN::asServiceException);
        if (!isTeamLeader(teamId)) {
            AuthenticationUtil.validateCurrentUserMatches(member.getWebUser().getUser().getId());
            member.setName(updateInfo.getName());
            return;
        }
        if (member.getWebUser().getId().equals(AuthenticationUtil.getCurrentWebUserId()) && !updateInfo.isLeader()) {
            long leaderCount = team.getMembers().stream().filter(MakerTeamMember::isLeader).count();
            if (leaderCount == 1) {
                throw ErrorStatus.INVALID_INPUT.asServiceException();
            }
        }
        member.setName(updateInfo.getName());
        member.setLeader(updateInfo.isLeader());
    }
}
