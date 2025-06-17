package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ServerMemberDto;
import com.crimecat.backend.chat.service.ServerMemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/servers/{serverId}/members")
@RequiredArgsConstructor
@Slf4j
public class ServerMemberController {

    private final ServerMemberService serverMemberService;

    /**
     * 서버의 모든 멤버 조회
     */
    @GetMapping
    public ResponseEntity<List<ServerMemberDto>> getAllMembers(@PathVariable Long serverId) {
        List<ServerMemberDto> members = serverMemberService.getAllMembers(serverId);
        return ResponseEntity.ok(members);
    }

    /**
     * 서버의 멤버를 페이징으로 조회
     */
    @GetMapping("/page")
    public ResponseEntity<Page<ServerMemberDto>> getMembersByPage(
            @PathVariable Long serverId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ServerMemberDto> members = serverMemberService.getMembersByPage(serverId, pageable);
        return ResponseEntity.ok(members);
    }

    /**
     * 특정 멤버 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ServerMemberDto> getMember(
            @PathVariable Long serverId,
            @PathVariable UUID userId) {
        ServerMemberDto member = serverMemberService.getMember(serverId, userId);
        return ResponseEntity.ok(member);
    }

    /**
     * 멤버에게 역할 할당
     */
    @PostMapping("/{userId}/roles")
    public ResponseEntity<ServerMemberDto> assignRoles(
            @PathVariable Long serverId,
            @PathVariable UUID userId,
            @Valid @RequestBody ServerMemberDto.RoleAssignRequest request) {
        ServerMemberDto updatedMember = serverMemberService.assignRoles(serverId, userId, request);
        return ResponseEntity.ok(updatedMember);
    }

    /**
     * 멤버에서 특정 역할 제거
     */
    @DeleteMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<ServerMemberDto> removeRole(
            @PathVariable Long serverId,
            @PathVariable UUID userId,
            @PathVariable Long roleId) {
        ServerMemberDto updatedMember = serverMemberService.removeRole(serverId, userId, roleId);
        return ResponseEntity.ok(updatedMember);
    }

    /**
     * 멤버 서버별 프로필 업데이트
     */
    @PutMapping("/{userId}/profile")
    public ResponseEntity<ServerMemberDto> updateMemberProfile(
            @PathVariable Long serverId,
            @PathVariable UUID userId,
            @Valid @RequestBody ServerMemberDto.ProfileUpdateRequest request) {
        ServerMemberDto updatedMember = serverMemberService.updateMemberProfile(serverId, userId, request);
        return ResponseEntity.ok(updatedMember);
    }

    /**
     * 멤버의 권한 조회
     */
    @GetMapping("/{userId}/permissions")
    public ResponseEntity<List<String>> getMemberPermissions(
            @PathVariable Long serverId,
            @PathVariable UUID userId) {
        List<String> permissions = serverMemberService.getMemberPermissions(serverId, userId);
        return ResponseEntity.ok(permissions);
    }

    /**
     * 멤버의 특정 권한 확인
     */
    @GetMapping("/{userId}/permissions/{permission}")
    public ResponseEntity<Boolean> hasPermission(
            @PathVariable Long serverId,
            @PathVariable UUID userId,
            @PathVariable String permission) {
        boolean hasPermission = serverMemberService.hasPermission(serverId, userId, permission);
        return ResponseEntity.ok(hasPermission);
    }
}