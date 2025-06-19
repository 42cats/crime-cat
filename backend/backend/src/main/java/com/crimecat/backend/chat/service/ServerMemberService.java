package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ServerMember;
import com.crimecat.backend.chat.domain.ServerRole;
import com.crimecat.backend.chat.dto.ServerMemberDto;
import com.crimecat.backend.chat.repository.ChatServerRepository;
import com.crimecat.backend.chat.repository.ServerMemberRepository;
import com.crimecat.backend.chat.repository.ServerRoleRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public List<ServerMemberDto> getAllMembers(UUID serverId) {
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
    public Page<ServerMemberDto> getMembersByPage(UUID serverId, Pageable pageable) {
        validateServerExists(serverId);
        
        Page<ServerMember> members = serverMemberRepository.findByServerIdAndIsActiveTrue(serverId, pageable);
        return members.map(this::convertToDto);
    }

    /**
     * 특정 멤버 조회
     */
    @Transactional(readOnly = true)
    public ServerMemberDto getMember(UUID serverId, UUID userId) {
        validateServerExists(serverId);
        
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
                
        return convertToDto(member);
    }

    /**
     * 멤버에게 역할 할당 (웹 클라이언트용)
     */
    public ServerMemberDto assignRoles(UUID serverId, UUID userId, ServerMemberDto.RoleAssignRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        return assignRoles(serverId, userId, request, currentUserId);
    }
    
    /**
     * 멤버에게 역할 할당 (Signal Server용)
     */
    public ServerMemberDto assignRoles(UUID serverId, UUID userId, ServerMemberDto.RoleAssignRequest request, WebUser currentUser) {
        return assignRoles(serverId, userId, request, currentUser.getId());
    }
    
    /**
     * 멤버에게 역할 할당 (내부 구현)
     */
    private ServerMemberDto assignRoles(UUID serverId, UUID userId, ServerMemberDto.RoleAssignRequest request, UUID currentUserId) {
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 멤버 조회
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        // 역할 유효성 확인
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            List<ServerRole> roles = serverRoleRepository.findByIdsAndServerId(request.getRoleIds(), serverId);
            if (roles.size() != request.getRoleIds().size()) {
                throw ErrorStatus.INVALID_ROLE.asServiceException();
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
     * 멤버에서 특정 역할 제거 (웹 클라이언트용)
     */
    public ServerMemberDto removeRole(UUID serverId, UUID userId, UUID roleId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        return removeRole(serverId, userId, roleId, currentUserId);
    }
    
    /**
     * 멤버에서 특정 역할 제거 (Signal Server용)
     */
    public ServerMemberDto removeRole(UUID serverId, UUID userId, UUID roleId, WebUser currentUser) {
        return removeRole(serverId, userId, roleId, currentUser.getId());
    }
    
    /**
     * 멤버에서 특정 역할 제거 (내부 구현)
     */
    private ServerMemberDto removeRole(UUID serverId, UUID userId, UUID roleId, UUID currentUserId) {
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 멤버 조회
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asServiceException());

        // 역할 제거
        member.removeRole(roleId);
        ServerMember updatedMember = serverMemberRepository.save(member);

        log.info("Removed role {} from member {} in server {} by user {}", 
                roleId, userId, serverId, currentUserId);

        return convertToDto(updatedMember);
    }

    /**
     * 멤버 서버별 프로필 업데이트 (웹 클라이언트용)
     */
    public ServerMemberDto updateMemberProfile(UUID serverId, UUID userId, ServerMemberDto.ProfileUpdateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        return updateMemberProfile(serverId, userId, request, currentUserId);
    }
    
    /**
     * 멤버 서버별 프로필 업데이트 (Signal Server용)
     */
    public ServerMemberDto updateMemberProfile(UUID serverId, UUID userId, ServerMemberDto.ProfileUpdateRequest request, WebUser currentUser) {
        return updateMemberProfile(serverId, userId, request, currentUser.getId());
    }
    
    /**
     * 멤버 서버별 프로필 업데이트 (내부 구현)
     */
    private ServerMemberDto updateMemberProfile(UUID serverId, UUID userId, ServerMemberDto.ProfileUpdateRequest request, UUID currentUserId) {
        // 본인이거나 관리자만 가능
        if (!currentUserId.equals(userId)) {
            validateServerAdminPermission(serverId, currentUserId);
        }
        
        // 멤버 조회
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, userId)
                .orElseThrow(() -> ErrorStatus.MEMBER_NOT_FOUND.asServiceException());

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
    public boolean hasServerAdminPermission(UUID serverId, UUID userId) {
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
    public long countMembersWithRole(UUID serverId, UUID roleId) {
        List<ServerMember> members = serverMemberRepository.findByServerIdAndIsActiveTrue(serverId);
        return members.stream()
                .filter(member -> member.hasRole(roleId))
                .count();
    }

    /**
     * 멤버의 권한 확인
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID serverId, UUID userId, String permission) {
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
    public List<String> getMemberPermissions(UUID serverId, UUID userId) {
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

    /**
     * 서버 멤버십 확인
     */
    @Transactional(readOnly = true)
    public boolean hasServerMembership(UUID serverId, UUID userId) {
        return serverMemberRepository.existsByServerIdAndUserIdAndIsActiveTrue(serverId, userId);
    }

    // === Private Helper Methods ===

    private ChatServer validateServerExists(UUID serverId) {
        return chatServerRepository.findById(serverId)
                .filter(ChatServer::getIsActive)
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
    }

    private void validateServerAdminPermission(UUID serverId, UUID userId) {
        if (!hasServerAdminPermission(serverId, userId)) {
            throw ErrorStatus.INSUFFICIENT_PERMISSION.asServiceException();
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

    /**
     * 사용자가 서버 멤버인지 확인
     */
    @Transactional(readOnly = true)
    public boolean isServerMember(UUID serverId, UUID userId) {
        return serverMemberRepository.existsByServerIdAndUserIdAndIsActiveTrue(serverId, userId);
    }

    /**
     * Signal Server용 멤버 조회 (인증 없이) - WebUser ID를 User ID로 매핑
     */
    @Transactional(readOnly = true)
    public ServerMemberDto getMemberForSignalServer(UUID serverId, UUID webUserId) {
        validateServerExists(serverId);
        
        // WebUser -> User ID 매핑
        UUID actualUserId = mapWebUserToUserId(webUserId);
        log.info("🔄 Signal Server request: WebUser {} mapped to User {} for server {}", 
                webUserId, actualUserId, serverId);
        
        ServerMember member = serverMemberRepository.findByServerIdAndUserIdAndIsActiveTrue(serverId, actualUserId)
                .orElseThrow(() -> {
                    log.error("❌ Server member not found for User ID: {} in server: {}", actualUserId, serverId);
                    return ErrorStatus.USER_NOT_FOUND.asServiceException();
                });
                
        return convertToDto(member);
    }
    
    /**
     * WebUser ID를 User ID로 매핑합니다
     */
    private UUID mapWebUserToUserId(UUID webUserId) {
        // WebUser 엔티티에서 User 참조를 통해 User ID 가져오기
        return userRepository.findByWebUserId(webUserId)
                .map(user -> {
                    log.debug("🔄 Mapped WebUser {} to User {}", webUserId, user.getId());
                    return user.getId();
                })
                .orElseThrow(() -> {
                    log.error("❌ User not found for WebUser ID: {}", webUserId);
                    return ErrorStatus.USER_NOT_FOUND.asServiceException();
                });
    }
}