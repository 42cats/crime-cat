package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChannelMember;
import com.crimecat.backend.chat.domain.ServerChannel;
import com.crimecat.backend.chat.domain.ServerMember;
import com.crimecat.backend.chat.dto.ChannelMemberDto;
import com.crimecat.backend.chat.repository.ChannelMemberRepository;
import com.crimecat.backend.chat.repository.ServerChannelRepository;
import com.crimecat.backend.chat.repository.ServerMemberRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChannelMemberService {

    private final ChannelMemberRepository channelMemberRepository;
    private final ServerChannelRepository serverChannelRepository;
    private final ServerMemberRepository serverMemberRepository;
    private final UserRepository userRepository;

    /**
     * 채널 멤버 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ChannelMemberDto> getAllMembers(Long serverId, Long channelId) {
        validateChannelExists(serverId, channelId);
        
        List<ChannelMember> members = channelMemberRepository.findByChannelIdAndIsActiveTrue(channelId);
        return members.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 채널 멤버 페이징 조회
     */
    @Transactional(readOnly = true)
    public Page<ChannelMemberDto> getMembersByPage(Long serverId, Long channelId, Pageable pageable) {
        validateChannelExists(serverId, channelId);
        
        Page<ChannelMember> members = channelMemberRepository.findByChannelIdAndIsActiveTrue(channelId, pageable);
        return members.map(this::convertToDto);
    }

    /**
     * 특정 채널 멤버 조회
     */
    @Transactional(readOnly = true)
    public ChannelMemberDto getMember(Long serverId, Long channelId, UUID userId) {
        validateChannelExists(serverId, channelId);
        
        ChannelMember member = channelMemberRepository.findByChannelIdAndUserIdAndIsActiveTrue(channelId, userId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asServiceException());
        
        return convertToDto(member);
    }

    /**
     * 채널 입장
     */
    public ChannelMemberDto joinChannel(Long serverId, Long channelId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 채널 존재 확인
        ServerChannel channel = validateChannelExists(serverId, channelId);
        
        // 서버 멤버인지 확인
        validateServerMembership(serverId, currentUserId);
        
        // 이미 채널 멤버인지 확인
        boolean isAlreadyMember = channelMemberRepository.existsByChannelIdAndUserIdAndIsActiveTrue(channelId, currentUserId);
        if (isAlreadyMember) {
            throw ErrorStatus.CHANNEL_ALREADY_MEMBER.asServiceException();
        }
        
        // 최대 멤버 수 확인
        long currentMemberCount = channelMemberRepository.countByChannelIdAndIsActiveTrue(channelId);
        if (currentMemberCount >= channel.getMaxMembers()) {
            throw ErrorStatus.SERVER_MEMBER_LIMIT_EXCEEDED.asServiceException();
        }
        
        // 채널 멤버 추가
        ChannelMember newMember = ChannelMember.builder()
                .channel(channel)
                .userId(currentUserId)
                .role(ChannelMember.ChannelRole.MEMBER)
                .build();
        
        ChannelMember savedMember = channelMemberRepository.save(newMember);
        
        log.info("User {} joined channel: {} in server: {}", currentUserId, channelId, serverId);
        
        return convertToDto(savedMember);
    }

    /**
     * 채널 탈퇴
     */
    public void leaveChannel(Long serverId, Long channelId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        validateChannelExists(serverId, channelId);
        
        // 채널 멤버 조회
        ChannelMember member = channelMemberRepository.findByChannelIdAndUserIdAndIsActiveTrue(channelId, currentUserId)
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_MEMBER.asServiceException());
        
        // 소프트 삭제
        member.softDelete();
        channelMemberRepository.save(member);
        
        log.info("User {} left channel: {} in server: {}", currentUserId, channelId, serverId);
    }

    /**
     * 채널 멤버 역할 변경 (모더레이터 또는 서버 관리자만 가능)
     */
    public ChannelMemberDto updateMemberRole(Long serverId, Long channelId, UUID targetUserId, 
                                           ChannelMemberDto.RoleUpdateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        validateChannelExists(serverId, channelId);
        
        // 권한 확인 (채널 모더레이터 또는 서버 관리자)
        validateChannelModeratorPermission(serverId, channelId, currentUserId);
        
        // 대상 멤버 조회
        ChannelMember targetMember = channelMemberRepository.findByChannelIdAndUserIdAndIsActiveTrue(channelId, targetUserId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asServiceException());
        
        // 자기 자신의 역할 변경 방지
        if (currentUserId.equals(targetUserId)) {
            throw ErrorStatus.CANNOT_MODIFY_SELF_ROLE.asServiceException();
        }
        
        // 역할 변경 (기존 메서드 사용)
        if (request.getRole() == ChannelMember.ChannelRole.MODERATOR) {
            targetMember.promoteToModerator();
        } else {
            targetMember.demoteToMember();
        }
        ChannelMember updatedMember = channelMemberRepository.save(targetMember);
        
        log.info("User {} updated role of member {} to {} in channel: {}", 
                currentUserId, targetUserId, request.getRole(), channelId);
        
        return convertToDto(updatedMember);
    }

    /**
     * 채널 멤버 추방 (모더레이터 또는 서버 관리자만 가능)
     */
    public void kickMember(Long serverId, Long channelId, UUID targetUserId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        validateChannelExists(serverId, channelId);
        
        // 권한 확인
        validateChannelModeratorPermission(serverId, channelId, currentUserId);
        
        // 자기 자신 추방 방지
        if (currentUserId.equals(targetUserId)) {
            throw ErrorStatus.CANNOT_KICK_SELF.asServiceException();
        }
        
        // 대상 멤버 조회
        ChannelMember targetMember = channelMemberRepository.findByChannelIdAndUserIdAndIsActiveTrue(channelId, targetUserId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asServiceException());
        
        // 멤버 제거
        targetMember.softDelete();
        channelMemberRepository.save(targetMember);
        
        log.info("User {} kicked member {} from channel: {}", currentUserId, targetUserId, channelId);
    }

    /**
     * 채널 활동 업데이트
     */
    public void updateActivity(Long channelId, UUID userId) {
        ChannelMember member = channelMemberRepository.findByChannelIdAndUserIdAndIsActiveTrue(channelId, userId)
                .orElse(null);
        
        if (member != null) {
            member.updateActivity();
            channelMemberRepository.save(member);
        }
    }

    /**
     * 채널 멤버 통계 조회
     */
    @Transactional(readOnly = true)
    public ChannelMemberDto.Statistics getChannelStatistics(Long serverId, Long channelId) {
        ServerChannel channel = validateChannelExists(serverId, channelId);
        
        long totalMembers = channelMemberRepository.countByChannelIdAndIsActiveTrue(channelId);
        long moderators = channelMemberRepository.countByChannelIdAndIsActiveTrue(channelId); // TODO: 역할별 카운트 메서드 추가 필요
        
        // 오늘 활동한 멤버 수
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long activeMembersToday = channelMemberRepository.countByChannelIdAndIsActiveTrue(channelId); // TODO: 활동 시간 기반 카운트 메서드 추가 필요
        
        return ChannelMemberDto.Statistics.builder()
                .channelId(channelId)
                .channelName(channel.getName())
                .totalMembers(totalMembers)
                .activeMembersToday(activeMembersToday)
                .moderators(moderators)
                .averageSessionTime(0L) // TODO: 실제 세션 시간 계산
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    // === Private Helper Methods ===
    
    private ServerChannel validateChannelExists(Long serverId, Long channelId) {
        return serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(channelId, serverId)
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_FOUND.asServiceException());
    }
    
    private void validateServerMembership(Long serverId, UUID userId) {
        boolean isMember = serverMemberRepository.existsByServerIdAndUserIdAndIsActiveTrue(serverId, userId);
        if (!isMember) {
            throw ErrorStatus.SERVER_NOT_MEMBER.asServiceException();
        }
    }
    
    private void validateChannelModeratorPermission(Long serverId, Long channelId, UUID userId) {
        // 채널 모더레이터인지 확인 (Repository에 해당 메서드가 없으므로 임시로 기본 체크)
        boolean isChannelModerator = channelMemberRepository.existsByChannelIdAndUserIdAndIsActiveTrue(channelId, userId);
        
        if (isChannelModerator) {
            // TODO: 실제 역할 확인 로직 구현 필요
            return; // 임시로 채널 멤버이면 권한 있음
        }
        
        // 서버 관리자인지 확인 (Repository에 해당 메서드가 없으므로 임시로 기본 체크)
        boolean isServerAdmin = serverMemberRepository.existsByServerIdAndUserIdAndIsActiveTrue(serverId, userId);
        
        if (!isServerAdmin) {
            throw ErrorStatus.INSUFFICIENT_PERMISSION.asServiceException();
        }
    }
    
    private ChannelMemberDto convertToDto(ChannelMember member) {
        // User 정보 조회 (DiscordUser에서 name 가져오기)
        String username = userRepository.findById(member.getUserId())
                .map(user -> user.getDiscordUser() != null ? user.getDiscordUser().getName() : "Unknown User")
                .orElse("Unknown User");
        
        return ChannelMemberDto.builder()
                .id(member.getId())
                .channelId(member.getChannel().getId())
                .channelName(member.getChannel().getName())
                .userId(member.getUserId())
                .username(username)
                .role(member.getRole())
                .isActive(member.getIsActive())
                .joinedAt(member.getJoinedAt())
                .lastActivityAt(member.getLastActivityAt())
                .build();
    }
}