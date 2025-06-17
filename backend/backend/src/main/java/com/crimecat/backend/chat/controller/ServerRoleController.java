package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ServerRoleDto;
import com.crimecat.backend.chat.service.ServerRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/servers/{serverId}/roles")
@RequiredArgsConstructor
@Slf4j
public class ServerRoleController {

    private final ServerRoleService serverRoleService;

    /**
     * 서버의 모든 역할 조회
     */
    @GetMapping
    public ResponseEntity<List<ServerRoleDto>> getAllRoles(@PathVariable Long serverId) {
        List<ServerRoleDto> roles = serverRoleService.getAllRoles(serverId);
        return ResponseEntity.ok(roles);
    }

    /**
     * 서버의 역할을 페이징으로 조회
     */
    @GetMapping("/page")
    public ResponseEntity<Page<ServerRoleDto>> getRolesByPage(
            @PathVariable Long serverId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ServerRoleDto> roles = serverRoleService.getRolesByPage(serverId, pageable);
        return ResponseEntity.ok(roles);
    }

    /**
     * 특정 역할 조회
     */
    @GetMapping("/{roleId}")
    public ResponseEntity<ServerRoleDto> getRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId) {
        ServerRoleDto role = serverRoleService.getRole(serverId, roleId);
        return ResponseEntity.ok(role);
    }

    /**
     * 역할 생성 (서버 관리자만 가능)
     */
    @PostMapping
    public ResponseEntity<ServerRoleDto> createRole(
            @PathVariable Long serverId,
            @Valid @RequestBody ServerRoleDto.CreateRequest request) {
        ServerRoleDto createdRole = serverRoleService.createRole(serverId, request);
        return ResponseEntity.ok(createdRole);
    }

    /**
     * 역할 수정
     */
    @PutMapping("/{roleId}")
    public ResponseEntity<ServerRoleDto> updateRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId,
            @Valid @RequestBody ServerRoleDto.UpdateRequest request) {
        ServerRoleDto updatedRole = serverRoleService.updateRole(serverId, roleId, request);
        return ResponseEntity.ok(updatedRole);
    }

    /**
     * 역할 삭제
     */
    @DeleteMapping("/{roleId}")
    public ResponseEntity<Void> deleteRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId) {
        serverRoleService.deleteRole(serverId, roleId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 관리자 역할 조회
     */
    @GetMapping("/admin")
    public ResponseEntity<List<ServerRoleDto>> getAdminRoles(@PathVariable Long serverId) {
        List<ServerRoleDto> adminRoles = serverRoleService.getAdminRoles(serverId);
        return ResponseEntity.ok(adminRoles);
    }
}