package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ServerMember;
import com.crimecat.backend.chat.domain.ServerRole;
import com.crimecat.backend.chat.dto.ServerMemberDto;
import com.crimecat.backend.chat.repository.ChatServerRepository;
import com.crimecat.backend.chat.repository.ServerMemberRepository;
import com.crimecat.backend.chat.repository.ServerRoleRepository;
import com.crimecat.backend.exception.CrimeCatException;
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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ServerMemberService {

    private final ServerMemberRepository serverMemberRepository;
    private final ChatServerRepository chatServerRepository;
    private final ServerRoleRepository serverRoleRepository;
    private final UserRepository userRepository;

    /**
     * 서버 멤버 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ServerMemberDto> getAllMembers(Long serverId) {
        validateServerExists(serverId);
        
        List<ServerMember> members = serverMemberRepository.findByServerIdAndIsActiveTrue(serverId);
        return members.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 서버 멤버를 페이징으로 조회
     */
    @Transactional(readOnly = true)
    public Page<ServerMemberDto> getMembersByPage(Long serverId, Pageable pageable) {
        validateServerExists(serverId);
        
        Page<ServerMember> members = serverMemberRepository.findByServerIdAndIsActiveTrue(serverId, pageable);
        return members.map(this::convertToDto);
    }

    /**
     * 특정 멤버 조회
     */
    @Transactional(readOnly = true)
    public ServerMemberDto getMember(Long serverId, UUID userId) {
        validateServerExists(serverId);
        
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asException());
                
        return convertToDto(member);
    }

    /**
     * 멤버에게 역할 할당
     */
    public ServerMemberDto assignRoles(Long serverId, UUID userId, ServerMemberDto.RoleAssignRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 멤버 조회
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asException());

        // 역할 유효성 확인
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            List<ServerRole> roles = serverRoleRepository.findByIdsAndServerId(request.getRoleIds(), serverId);
            if (roles.size() != request.getRoleIds().size()) {
                throw ErrorStatus.INVALID_ROLE.asException();
            }
        }

        // 역할 할당
        member.assignRoles(request.getRoleIds());
        ServerMember updatedMember = serverMemberRepository.save(member);

        log.info("Assigned roles {} to member {} in server {} by user {}", 
                request.getRoleIds(), userId, serverId, currentUserId);

        return convertToDto(updatedMember);
    }

    /**
     * 멤버에서 특정 역할 제거
     */
    public ServerMemberDto removeRole(Long serverId, UUID userId, Long roleId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 멤버 조회
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asException());

        // 역할 제거
        member.removeRole(roleId);
        ServerMember updatedMember = serverMemberRepository.save(member);

        log.info("Removed role {} from member {} in server {} by user {}", 
                roleId, userId, serverId, currentUserId);

        return convertToDto(updatedMember);
    }

    /**
     * 멤버 서버별 프로필 업데이트
     */
    public ServerMemberDto updateMemberProfile(Long serverId, UUID userId, ServerMemberDto.ProfileUpdateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 본인이거나 관리자만 가능
        if (!currentUserId.equals(userId)) {
            validateServerAdminPermission(serverId, currentUserId);
        }
        
        // 멤버 조회
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asException());

        // 프로필 업데이트
        member.updateProfile(request.getDisplayName(), request.getAvatarUrl());
        ServerMember updatedMember = serverMemberRepository.save(member);

        log.info("Updated profile for member {} in server {} by user {}", 
                userId, serverId, currentUserId);

        return convertToDto(updatedMember);
    }

    /**
     * 서버 관리자 권한 확인
     */
    @Transactional(readOnly = true)
    public boolean hasServerAdminPermission(Long serverId, UUID userId) {
        // 서버 소유자 확인
        ChatServer server = chatServerRepository.findById(serverId)
                .filter(s -> s.getIsActive())
                .orElse(null);
        
        if (server != null && server.isOwner(userId)) {
            return true;
        }

        // 멤버 권한 확인
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElse(null);
                
        if (member == null) {
            return false;
        }

        // 레거시 권한 확인
        if (member.getRole() == ServerMember.ServerRole.ADMIN) {
            return true;
        }

        // 커스텀 역할 권한 확인
        if (member.getAssignedRoles() != null && !member.getAssignedRoles().isEmpty()) {
            List<ServerRole> roles = serverRoleRepository.findByIdInAndIsActiveTrue(member.getAssignedRoles());
            return roles.stream().anyMatch(role -> role.hasPermission(ServerRole.Permissions.CAN_MANAGE_SERVER));
        }

        return false;
    }

    /**
     * 특정 역할을 가진 멤버 수 조회
     */
    @Transactional(readOnly = true)
    public long countMembersWithRole(Long serverId, Long roleId) {
        List<ServerMember> members = serverMemberRepository.findByServerIdAndIsActiveTrue(serverId);
        return members.stream()
                .filter(member -> member.hasRole(roleId))
                .count();
    }

    /**
     * 멤버의 권한 확인
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(Long serverId, UUID userId, String permission) {
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElse(null);
                
        if (member == null) {
            return false;
        }

        // 커스텀 역할 권한 확인
        if (member.getAssignedRoles() != null && !member.getAssignedRoles().isEmpty()) {
            List<ServerRole> roles = serverRoleRepository.findByIdInAndIsActiveTrue(member.getAssignedRoles());
            return roles.stream().anyMatch(role -> role.hasPermission(permission));
        }

        // 레거시 권한 확인
        if (member.getRole() == ServerMember.ServerRole.ADMIN) {
            return ServerRole.Permissions.ADMIN_PERMISSIONS.contains(permission);
        } else {
            return ServerRole.Permissions.MEMBER_PERMISSIONS.contains(permission);
        }
    }

    /**
     * 멤버의 모든 권한 조회
     */
    @Transactional(readOnly = true)
    public List<String> getMemberPermissions(Long serverId, UUID userId) {
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElse(null);
                
        if (member == null) {
            return List.of();
        }

        List<String> permissions = new ArrayList<>();

        // 커스텀 역할 권한
        if (member.getAssignedRoles() != null && !member.getAssignedRoles().isEmpty()) {
            List<ServerRole> roles = serverRoleRepository.findByIdInAndIsActiveTrue(member.getAssignedRoles());
            roles.forEach(role -> {
                if (role.getPermissions() != null) {
                    permissions.addAll(role.getPermissions());
                }
            });
        }

        // 레거시 권한
        if (member.getRole() == ServerMember.ServerRole.ADMIN) {
            permissions.addAll(ServerRole.Permissions.ADMIN_PERMISSIONS);
        } else {
            permissions.addAll(ServerRole.Permissions.MEMBER_PERMISSIONS);
        }

        // 중복 제거
        return permissions.stream().distinct().collect(Collectors.toList());
    }

    // === Private Helper Methods ===

    private ChatServer validateServerExists(Long serverId) {
        return chatServerRepository.findById(serverId)
                .filter(server -> server.getIsActive())
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asException());
    }

    private void validateServerAdminPermission(Long serverId, UUID userId) {
        if (!hasServerAdminPermission(serverId, userId)) {
            throw ErrorStatus.INSUFFICIENT_PERMISSION.asException();
        }
    }

    private ServerMemberDto convertToDto(ServerMember member) {
        // User 정보 조회
        User user = userRepository.findById(member.getUserId())
                .orElse(null);
                
        String defaultUsername = user != null ? user.getName() : "Unknown";
        String defaultAvatarUrl = user != null && user.getDiscordUser() != null ? 
                user.getDiscordUser().getAvatar() : null;

        return ServerMemberDto.from(member, defaultUsername, defaultAvatarUrl);
    }
}