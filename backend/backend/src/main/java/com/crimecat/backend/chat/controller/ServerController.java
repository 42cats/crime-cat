package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ServerDto;
import com.crimecat.backend.chat.service.ServerService;
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
@RequestMapping("/api/v1/servers")
@RequiredArgsConstructor
@Slf4j
public class ServerController {

    private final ServerService serverService;

    /**
     * 서버 생성
     */
    @PostMapping
    public ResponseEntity<ServerDto.Response> createServer(
            @Valid @RequestBody ServerDto.CreateRequest request) {
        ServerDto.Response createdServer = serverService.createServer(request);
        return ResponseEntity.ok(createdServer);
    }

    /**
     * 서버 정보 조회
     */
    @GetMapping("/{serverId}")
    public ResponseEntity<ServerDto.Response> getServer(@PathVariable UUID serverId) {
        ServerDto.Response server = serverService.getServer(serverId);
        return ResponseEntity.ok(server);
    }

    /**
     * 사용자가 참여한 서버 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<List<ServerDto.Response>> getUserServers() {
        List<ServerDto.Response> servers = serverService.getUserServers();
        return ResponseEntity.ok(servers);
    }

    /**
     * 공개 서버 목록 조회 (페이징)
     */
    @GetMapping("/public")
    public ResponseEntity<Page<ServerDto.Response>> getPublicServers(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ServerDto.Response> servers = serverService.getPublicServers(pageable);
        return ResponseEntity.ok(servers);
    }

    /**
     * 서버 입장
     */
    @PostMapping("/{serverId}/join")
    public ResponseEntity<ServerDto.Response> joinServer(
            @PathVariable UUID serverId,
            @Valid @RequestBody ServerDto.JoinRequest request) {
        ServerDto.Response server = serverService.joinServer(serverId, request);
        return ResponseEntity.ok(server);
    }

    /**
     * 서버 탈퇴
     */
    @PostMapping("/{serverId}/leave")
    public ResponseEntity<Void> leaveServer(@PathVariable UUID serverId) {
        serverService.leaveServer(serverId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 서버 정보 수정 (소유자만 가능)
     */
    @PutMapping("/{serverId}")
    public ResponseEntity<ServerDto.Response> updateServer(
            @PathVariable UUID serverId,
            @Valid @RequestBody ServerDto.UpdateRequest request) {
        ServerDto.Response updatedServer = serverService.updateServer(serverId, request);
        return ResponseEntity.ok(updatedServer);
    }

    /**
     * 서버 삭제 (소유자만 가능)
     */
    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(@PathVariable UUID serverId) {
        serverService.deleteServer(serverId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 멤버 추방 (관리자만 가능)
     */
    @DeleteMapping("/{serverId}/members/{userId}")
    public ResponseEntity<Void> kickMember(
            @PathVariable UUID serverId,
            @PathVariable UUID userId) {
        serverService.kickMember(serverId, userId);
        return ResponseEntity.noContent().build();
    }
}