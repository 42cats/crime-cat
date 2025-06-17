package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ServerRole;
import com.crimecat.backend.chat.dto.ServerRoleDto;
import com.crimecat.backend.chat.repository.ChatServerRepository;
import com.crimecat.backend.chat.repository.ServerRoleRepository;
import com.crimecat.backend.exception.CrimeCatException;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ServerRoleService {

    private final ServerRoleRepository serverRoleRepository;
    private final ChatServerRepository chatServerRepository;
    private final ServerMemberService serverMemberService;

    /**
     * 서버의 모든 역할 조회
     */
    @Transactional(readOnly = true)
    public List<ServerRoleDto> getAllRoles(Long serverId) {
        validateServerExists(serverId);
        
        List<ServerRole> roles = serverRoleRepository.findByServerIdAndIsActiveTrueOrderByCreatedAt(serverId);
        return roles.stream()
                .map(ServerRoleDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 서버의 역할을 페이징으로 조회
     */
    @Transactional(readOnly = true)
    public Page<ServerRoleDto> getRolesByPage(Long serverId, Pageable pageable) {
        validateServerExists(serverId);
        
        Page<ServerRole> roles = serverRoleRepository.findByServerIdAndIsActiveTrue(serverId, pageable);
        return roles.map(ServerRoleDto::from);
    }

    /**
     * 역할 생성 (서버 관리자만 가능)
     */
    public ServerRoleDto createRole(Long serverId, ServerRoleDto.CreateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 서버 존재 확인
        ChatServer server = validateServerExists(serverId);
        
        // 서버 관리자 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 역할명 중복 확인
        if (serverRoleRepository.existsByServerIdAndNameAndIsActiveTrue(serverId, request.getName())) {
            throw ErrorStatus.ROLE_NAME_DUPLICATE.asServiceException();
        }

        // 권한 검증
        validatePermissions(request.getPermissions());

        // 역할 생성
        ServerRole role = ServerRole.builder()
                .server(server)
                .name(request.getName())
                .color(request.getColor())
                .permissions(request.getPermissions())
                .createdBy(currentUserId)
                .build();

        ServerRole savedRole = serverRoleRepository.save(role);
        log.info("Created server role: {} in server: {} by user: {}", 
                savedRole.getName(), serverId, currentUserId);

        return ServerRoleDto.from(savedRole);
    }

    /**
     * 역할 수정
     */
    public ServerRoleDto updateRole(Long serverId, Long roleId, ServerRoleDto.UpdateRequest request) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 역할 조회
        ServerRole role = serverRoleRepository.findById(roleId)
                .filter(r -> r.getServer().getId().equals(serverId) && r.getIsActive())
                .orElseThrow(() -> ErrorStatus.ROLE_NOT_FOUND.asServiceException());

        // 기본 역할 수정 방지 (Admin, Member)
        if (isDefaultRole(role.getName())) {
            throw ErrorStatus.CANNOT_MODIFY_DEFAULT_ROLE.asServiceException();
        }

        // 역할명 중복 확인 (자기 자신 제외)
        if (request.getName() != null && !request.getName().equals(role.getName())) {
            if (serverRoleRepository.existsByServerIdAndNameAndIsActiveTrue(serverId, request.getName())) {
                throw ErrorStatus.ROLE_NAME_DUPLICATE.asServiceException();
            }
        }

        // 권한 검증
        if (request.getPermissions() != null) {
            validatePermissions(request.getPermissions());
        }

        // 역할 업데이트
        role.updateInfo(request.getName(), request.getColor(), request.getPermissions());
        ServerRole updatedRole = serverRoleRepository.save(role);

        log.info("Updated server role: {} in server: {} by user: {}", 
                updatedRole.getName(), serverId, currentUserId);

        return ServerRoleDto.from(updatedRole);
    }

    /**
     * 역할 삭제
     */
    public void deleteRole(Long serverId, Long roleId) {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        // 권한 확인
        validateServerAdminPermission(serverId, currentUserId);
        
        // 역할 조회
        ServerRole role = serverRoleRepository.findById(roleId)
                .filter(r -> r.getServer().getId().equals(serverId) && r.getIsActive())
                .orElseThrow(() -> ErrorStatus.ROLE_NOT_FOUND.asServiceException());

        // 기본 역할 삭제 방지
        if (isDefaultRole(role.getName())) {
            throw ErrorStatus.CANNOT_DELETE_DEFAULT_ROLE.asServiceException();
        }

        // 역할을 사용 중인 멤버가 있는지 확인
        long memberCount = serverMemberService.countMembersWithRole(serverId, roleId);
        if (memberCount > 0) {
            throw ErrorStatus.ROLE_IN_USE.asServiceException();
        }

        // 소프트 삭제
        role.softDelete();
        serverRoleRepository.save(role);

        log.info("Deleted server role: {} in server: {} by user: {}", 
                role.getName(), serverId, currentUserId);
    }

    /**
     * 특정 역할 조회
     */
    @Transactional(readOnly = true)
    public ServerRoleDto getRole(Long serverId, Long roleId) {
        validateServerExists(serverId);
        
        ServerRole role = serverRoleRepository.findById(roleId)
                .filter(r -> r.getServer().getId().equals(serverId) && r.getIsActive())
                .orElseThrow(() -> ErrorStatus.ROLE_NOT_FOUND.asServiceException());

        return ServerRoleDto.from(role);
    }

    /**
     * 역할 ID 목록으로 역할들 조회
     */
    @Transactional(readOnly = true)
    public List<ServerRole> getRolesByIds(Long serverId, List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            return List.of();
        }
        return serverRoleRepository.findByIdsAndServerId(roleIds, serverId);
    }

    /**
     * 관리자 역할 조회
     */
    @Transactional(readOnly = true)
    public List<ServerRoleDto> getAdminRoles(Long serverId) {
        validateServerExists(serverId);
        
        List<ServerRole> adminRoles = serverRoleRepository.findAdminRolesByServerId(serverId);
        return adminRoles.stream()
                .map(ServerRoleDto::from)
                .collect(Collectors.toList());
    }

    // === Private Helper Methods ===

    private ChatServer validateServerExists(Long serverId) {
        return chatServerRepository.findById(serverId)
                .filter(server -> server.getIsActive())
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());
    }

    private void validateServerAdminPermission(Long serverId, UUID userId) {
        if (!serverMemberService.hasServerAdminPermission(serverId, userId)) {
            throw ErrorStatus.INSUFFICIENT_PERMISSION.asServiceException();
        }
    }

    private void validatePermissions(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            throw ErrorStatus.INVALID_PERMISSION.asServiceException();
        }

        // 유효한 권한 목록 확인
        List<String> validPermissions = List.of(
            ServerRole.Permissions.CAN_MANAGE_SERVER,
            ServerRole.Permissions.CAN_MANAGE_CHANNELS,
            ServerRole.Permissions.CAN_MANAGE_ROLES,
            ServerRole.Permissions.CAN_KICK_MEMBERS,
            ServerRole.Permissions.CAN_BAN_MEMBERS,
            ServerRole.Permissions.CAN_SEND_MESSAGES,
            ServerRole.Permissions.CAN_USE_VOICE,
            ServerRole.Permissions.CAN_MUTE_MEMBERS,
            ServerRole.Permissions.CAN_DEAFEN_MEMBERS,
            ServerRole.Permissions.CAN_MOVE_MEMBERS,
            ServerRole.Permissions.CAN_CREATE_INVITES,
            ServerRole.Permissions.CAN_MANAGE_NICKNAMES,
            ServerRole.Permissions.CAN_VIEW_AUDIT_LOG
        );

        for (String permission : permissions) {
            if (!validPermissions.contains(permission)) {
                throw ErrorStatus.INVALID_PERMISSION.asServiceException();
            }
        }
    }

    private boolean isDefaultRole(String roleName) {
        return "Admin".equals(roleName) || "Member".equals(roleName);
    }
}