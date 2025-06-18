package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ChannelMember;
import com.crimecat.backend.chat.domain.ServerChannel;
import com.crimecat.backend.chat.dto.ChannelDto;
import com.crimecat.backend.chat.repository.ChannelMemberRepository;
import com.crimecat.backend.chat.repository.ChatServerRepository;
import com.crimecat.backend.chat.repository.ServerChannelRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChannelService {

    private final ServerChannelRepository serverChannelRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final ChatServerRepository chatServerRepository;
    private final ServerMemberService serverMemberService;

    /**
     * 채널 생성 (서버 관리자만 가능)
     */
    public ChannelDto.Response createChannel(UUID serverId, ChannelDto.CreateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 존재 확인
        ChatServer server = validateServerExists(serverId);
        
        // 서버 관리자 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 채널명 중복 확인
        boolean nameExists = serverChannelRepository.existsByServerIdAndNameAndIsActiveTrue(serverId, request.getName());
        if (nameExists) {
            throw ErrorStatus.CHANNEL_NAME_DUPLICATE.asServiceException();
        }

        // 채널 타입 검증
        ServerChannel.ChannelType channelType;
        try {
            channelType = ServerChannel.ChannelType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ErrorStatus.INVALID_CHANNEL_TYPE.asServiceException();
        }

        // 채널 생성
        ServerChannel channel = ServerChannel.builder()
                .server(server)
                .name(request.getName())
                .description(request.getDescription())
                .channelType(channelType)
                .createdBy(currentUserId)
                .build();

        ServerChannel savedChannel = serverChannelRepository.save(channel);

        log.info("Created channel: {} in server: {} by user: {}", 
                savedChannel.getName(), serverId, currentUserId);

        return ChannelDto.from(savedChannel);
    }

    /**
     * 서버의 모든 채널 조회
     */
    @Transactional(readOnly = true)
    public List<ChannelDto.Response> getServerChannels(UUID serverId) {
        validateServerExists(serverId);
        
        List<ServerChannel> channels = serverChannelRepository.findByServerIdAndIsActiveTrueOrderByCreatedAt(serverId);
        return channels.stream()
                .map(ChannelDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 채널 조회
     */
    @Transactional(readOnly = true)
    public ChannelDto.Response getChannel(UUID serverId, UUID channelId) {
        validateServerExists(serverId);
        
        ServerChannel channel = serverChannelRepository.findById(channelId)
                .filter(c -> c.getServer().getId().equals(serverId) && c.getIsActive())
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_FOUND.asServiceException());

        return ChannelDto.from(channel);
    }

    /**
     * 채널 정보 수정 (서버 관리자만 가능)
     */
    public ChannelDto.Response updateChannel(UUID serverId, UUID channelId, ChannelDto.UpdateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 채널 조회
        ServerChannel channel = serverChannelRepository.findById(channelId)
                .filter(c -> c.getServer().getId().equals(serverId) && c.getIsActive())
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_FOUND.asServiceException());

        // 채널명 중복 확인 (자기 자신 제외)
        if (request.getName() != null && !request.getName().equals(channel.getName())) {
            boolean nameExists = serverChannelRepository.existsByServerIdAndNameAndIsActiveTrue(serverId, request.getName());
            if (nameExists) {
                throw ErrorStatus.CHANNEL_NAME_DUPLICATE.asServiceException();
            }
        }

        // 채널 타입 검증
        ServerChannel.ChannelType channelType = null;
        if (request.getType() != null) {
            try {
                channelType = ServerChannel.ChannelType.valueOf(request.getType().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw ErrorStatus.INVALID_CHANNEL_TYPE.asServiceException();
            }
        }

        // 채널 정보 업데이트
        channel.updateInfo(request.getName(), request.getDescription(), channelType, null);
        ServerChannel updatedChannel = serverChannelRepository.save(channel);

        log.info("Updated channel: {} in server: {} by user: {}", 
                channelId, serverId, currentUserId);

        return ChannelDto.from(updatedChannel);
    }

    /**
     * 채널 삭제 (서버 관리자만 가능)
     */
    public void deleteChannel(UUID serverId, UUID channelId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 채널 조회
        ServerChannel channel = serverChannelRepository.findById(channelId)
                .filter(c -> c.getServer().getId().equals(serverId) && c.getIsActive())
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_FOUND.asServiceException());

        // 소프트 삭제
        channel.softDelete();
        serverChannelRepository.save(channel);

        // 모든 채널 멤버 비활성화
        List<ChannelMember> members = channelMemberRepository.findByChannelIdAndIsActiveTrue(channelId);
        members.forEach(ChannelMember::softDelete);
        channelMemberRepository.saveAll(members);

        log.info("Deleted channel: {} in server: {} by user: {}", 
                channelId, serverId, currentUserId);
    }

    /**
     * 채널 입장
     */
    public ChannelDto.Response joinChannel(UUID serverId, UUID channelId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 멤버 확인
        if (!serverMemberService.hasServerMembership(serverId, currentUserId)) {
            throw ErrorStatus.SERVER_NOT_MEMBER.asServiceException();
        }
        
        // 채널 조회
        ServerChannel channel = serverChannelRepository.findById(channelId)
                .filter(c -> c.getServer().getId().equals(serverId) && c.getIsActive())
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_FOUND.asServiceException());

        // 이미 채널 멤버인지 확인
        boolean isAlreadyMember = channelMemberRepository.existsByChannelIdAndUserIdAndIsActiveTrue(channelId, currentUserId);
        if (isAlreadyMember) {
            throw ErrorStatus.CHANNEL_ALREADY_MEMBER.asServiceException();
        }

        // 채널 멤버 추가
        ChannelMember member = ChannelMember.builder()
                .channel(channel)
                .userId(currentUserId)
                .role(ChannelMember.ChannelRole.MEMBER)
                .build();
        
        channelMemberRepository.save(member);

        log.info("User {} joined channel: {} in server: {}", currentUserId, channelId, serverId);

        return ChannelDto.from(channel);
    }

    /**
     * 채널 탈퇴
     */
    public void leaveChannel(UUID serverId, UUID channelId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 채널 멤버 조회
        ChannelMember member = channelMemberRepository.findByChannelIdAndUserIdAndIsActiveTrue(channelId, currentUserId)
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_MEMBER.asServiceException());

        // 채널 탈퇴
        member.softDelete();
        channelMemberRepository.save(member);

        log.info("User {} left channel: {} in server: {}", currentUserId, channelId, serverId);
    }

    // === Private Helper Methods ===

    private ChatServer validateServerExists(UUID serverId) {
        return chatServerRepository.findById(serverId)
                .filter(server -> server.getIsActive())
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());
    }

    private void validateServerAdminPermission(UUID serverId, UUID userId) {
        if (!serverMemberService.hasServerAdminPermission(serverId, userId)) {
            throw ErrorStatus.INSUFFICIENT_PERMISSION.asServiceException();
        }
    }
}