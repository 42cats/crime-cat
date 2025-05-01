package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.auth.service.DiscordOAuth2UserService;
import com.crimecat.backend.gametheme.dto.GetTeamResponse;
import com.crimecat.backend.gametheme.dto.GetTeamsResponse;
import com.crimecat.backend.gametheme.dto.MemberDto;
import com.crimecat.backend.gametheme.dto.MemberRequestDto;
import com.crimecat.backend.gametheme.dto.TeamDto;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.exception.ServiceException;
import com.crimecat.backend.gametheme.domain.MakerTeam;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.web.gametheme.dto.*;
import com.crimecat.backend.gametheme.repository.MakerTeamMemberRepository;
import com.crimecat.backend.gametheme.repository.MakerTeamRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MakerTeamService {
    private final MakerTeamRepository teamRepository;
    private final MakerTeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    private final DiscordOAuth2UserService oAuth2UserService;

    public void create(String name) {
        create(name, oAuth2UserService.getLoginUserId(), false);
    }

    @Transactional
    public UUID create(String name, UUID leader, boolean isIndividual) {
        MakerTeam team = teamRepository.save(MakerTeam.builder()
                .name(name)
                .isIndividual(isIndividual)
                .build());
        teamMemberRepository.save(MakerTeamMember.builder()
                .userId(leader)
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

    public List<MakerTeamMember> getIndividualTeams(UUID leaderId) {
        List<MakerTeamMember> teams = teamMemberRepository.findByUserIdAndIsLeader(leaderId, true);
        return teams.stream().filter(v -> v.getTeam().isIndividual()).toList();
    }

    @Transactional
    public void delete(UUID teamId) {
        isTeamLeaderOrThrow(teamId);
        teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        teamRepository.deleteById(teamId);
    }

    @Transactional
    public void addMembers(UUID teamId, Set<MemberRequestDto> members) {
        isTeamLeaderOrThrow(teamId);
        if (members.size() == 0) {
            return;
        }
        MakerTeam team = teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        if (team.isIndividual()) {
            team.setIndividual(false);
        }
        for (MemberRequestDto m : members) {
            MakerTeamMember.MakerTeamMemberBuilder builder = MakerTeamMember.builder().team(team);
            String name = m.getName();
            if (m.getUserId() != null) {
                // 유저 id 입력 시 유저 검색해서 삽입
                // TODO: 리스트 추가 시 에러 > exception 던질지 나머지는 처리할지
                User user = userRepository.findById(m.getUserId())
                        .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
                builder.userId(user.getId());
                // 팀 멤버 이름 명시하지 않았고, 유저 존재할 때 유저 정보에서 이름 가져오기
                if (name == null) {
                    name = user.getName();
                }
                // userId로 중복 유저 확인
                if (team.getMembers().stream().anyMatch(v -> user.getId().equals(v.getUserId()))) {
                    // TODO: 리스트 추가 시 에러 > exception 던질지 나머지는 처리할지
                    throw ErrorStatus.TEAM_MEMBER_ALREADY_REGISTERED.asServiceException();
                }
            }
            // 이름으로 중복유저 확인
            String finalName = name;
            if (team.getMembers().stream().anyMatch(v -> v.getName().equals(finalName))) {
                // TODO: 리스트 추가 시 에러 > exception 던질지 나머지는 처리할지
                throw ErrorStatus.TEAM_MEMBER_ALREADY_REGISTERED.asServiceException();
            }
            builder.name(name);
            teamMemberRepository.save(builder.build());
        }
        teamRepository.save(team);
    }

    @Transactional
    public void deleteMembers(UUID teamId, List<String> deletedMembers) {
        if (deletedMembers.size() == 0) {
            return;
        }
        try {
            isTeamLeaderOrThrow(teamId);
            MakerTeam team = teamRepository.findById(teamId).orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
            // 효율적으로 처리하기 위해 정렬
            deletedMembers.sort(Comparator.naturalOrder());
            List<MakerTeamMember> members = team.getMembers();
            members.sort(Comparator.comparing(MakerTeamMember::getId));
            Iterator<MakerTeamMember> iterator = members.iterator();
            for (String deletedId : deletedMembers) {
                if (!iterator.hasNext()) {
                    break;
                }
                // 삭제하고자 하는 ID와 같은 ID 찾기
                MakerTeamMember member = iterator.next();
                String id = member.getId().toString();
                while (id.compareTo(deletedId) < 0 && iterator.hasNext()) {
                    member = iterator.next();
                    id = member.getId().toString();
                }
                // 같으면 제거
                if (deletedId.equals(id)) {
                    teamMemberRepository.deleteById(member.getId());
                    members.remove(member);
                }
            }
        } catch (ServiceException e) {
            UUID userId = oAuth2UserService.getLoginUserId();
            if (e.getStatus() == HttpStatus.FORBIDDEN && deletedMembers.contains(userId.toString())) {
                teamMemberRepository.deleteById(userId);
            } else {
                throw e;
            }
        }

    }

    private void isTeamLeaderOrThrow(UUID teamId) {
        UUID userId = oAuth2UserService.getLoginUserId();
        MakerTeamMember makerTeamMember = teamMemberRepository.findByUserIdAndTeamId(userId, teamId)
                .orElseThrow(ErrorStatus.FORBIDDEN::asServiceException);
        if (!makerTeamMember.isLeader()) {
            throw ErrorStatus.FORBIDDEN.asServiceException();
        }
    }

    public GetTeamsResponse getMyTeams() {
        return new GetTeamsResponse(
                teamMemberRepository.findByUserId(oAuth2UserService.getLoginUserId()).stream()
                        .map(v -> TeamDto.from(v.getTeam()))
                        .toList()
        );
    }
}
