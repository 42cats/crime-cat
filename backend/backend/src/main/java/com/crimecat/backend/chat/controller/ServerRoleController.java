package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ServerRoleDto;
import com.crimecat.backend.chat.service.ServerRoleService;
import com.crimecat.backend.utils.SignalServerAuthUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/signal/servers/{serverId}/roles")
@RequiredArgsConstructor
@Slf4j
public class ServerRoleController {

    private final ServerRoleService serverRoleService;
    private final SignalServerAuthUtil signalServerAuthUtil;

    /**
     * 서버의 모든 역할 조회
     */
    @GetMapping
    public ResponseEntity<List<ServerRoleDto>> getAllRoles(
            @PathVariable UUID serverId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_ALL_ROLES");
        List<ServerRoleDto> roles = serverRoleService.getAllRoles(serverId);
        return ResponseEntity.ok(roles);
    }

    /**
     * 서버의 역할을 페이징으로 조회
     */
    @GetMapping("/page")
    public ResponseEntity<Page<ServerRoleDto>> getRolesByPage(
            @PathVariable UUID serverId,
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_ROLES_BY_PAGE");
        Page<ServerRoleDto> roles = serverRoleService.getRolesByPage(serverId, pageable);
        return ResponseEntity.ok(roles);
    }

    /**
     * 특정 역할 조회
     */
    @GetMapping("/{roleId}")
    public ResponseEntity<ServerRoleDto> getRole(
            @PathVariable UUID serverId,
            @PathVariable UUID roleId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_ROLE");
        ServerRoleDto role = serverRoleService.getRole(serverId, roleId);
        return ResponseEntity.ok(role);
    }

    /**
     * 역할 생성 (서버 관리자만 가능)
     */
    @PostMapping
    public ResponseEntity<ServerRoleDto> createRole(
            @PathVariable UUID serverId,
            @Valid @RequestBody ServerRoleDto.CreateRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "CREATE_ROLE");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ServerRoleDto createdRole = serverRoleService.createRole(serverId, request);
        return ResponseEntity.ok(createdRole);
    }

    /**
     * 역할 수정
     */
    @PutMapping("/{roleId}")
    public ResponseEntity<ServerRoleDto> updateRole(
            @PathVariable UUID serverId,
            @PathVariable UUID roleId,
            @Valid @RequestBody ServerRoleDto.UpdateRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "UPDATE_ROLE");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ServerRoleDto updatedRole = serverRoleService.updateRole(serverId, roleId, request);
        return ResponseEntity.ok(updatedRole);
    }

    /**
     * 역할 삭제
     */
    @DeleteMapping("/{roleId}")
    public ResponseEntity<Void> deleteRole(
            @PathVariable UUID serverId,
            @PathVariable UUID roleId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "DELETE_ROLE");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        serverRoleService.deleteRole(serverId, roleId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 관리자 역할 조회
     */
    @GetMapping("/admin")
    public ResponseEntity<List<ServerRoleDto>> getAdminRoles(
            @PathVariable UUID serverId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_ADMIN_ROLES");
        List<ServerRoleDto> adminRoles = serverRoleService.getAdminRoles(serverId);
        return ResponseEntity.ok(adminRoles);
    }
}