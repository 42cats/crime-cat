package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ServerDto;
import com.crimecat.backend.chat.service.ServerService;
import com.crimecat.backend.utils.SignalServerAuthUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/signal/servers")
@RequiredArgsConstructor
@Slf4j
public class SignalServerController {

    private final ServerService serverService;
    private final SignalServerAuthUtil signalServerAuthUtil;

    /**
     * 서버 생성
     */
    @PostMapping
    public ResponseEntity<ServerDto.Response> createServer(
            @Valid @RequestBody ServerDto.CreateRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "CREATE_SERVER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ServerDto.Response createdServer = serverService.createServer(request, currentUser);
        return ResponseEntity.ok(createdServer);
    }

    /**
     * 서버 정보 조회
     */
    @GetMapping("/{serverId}")
    public ResponseEntity<ServerDto.Response> getServer(
            @PathVariable UUID serverId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_SERVER");
        ServerDto.Response server = serverService.getServer(serverId);
        return ResponseEntity.ok(server);
    }

    /**
     * 사용자가 참여한 서버 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<List<ServerDto.Response>> getUserServers(HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_USER_SERVERS");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        List<ServerDto.Response> servers = serverService.getUserServers();
        return ResponseEntity.ok(servers);
    }

    /**
     * 공개 서버 목록 조회 (페이징)
     */
    @GetMapping("/public")
    public ResponseEntity<Page<ServerDto.Response>> getPublicServers(
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_PUBLIC_SERVERS");
        Page<ServerDto.Response> servers = serverService.getPublicServers(pageable);
        return ResponseEntity.ok(servers);
    }

    /**
     * 서버 입장
     */
    @PostMapping("/{serverId}/join")
    public ResponseEntity<ServerDto.Response> joinServer(
            @PathVariable UUID serverId,
            @Valid @RequestBody ServerDto.JoinRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "JOIN_SERVER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ServerDto.Response server = serverService.joinServer(serverId, request, currentUser);
        return ResponseEntity.ok(server);
    }

    /**
     * 서버 탈퇴
     */
    @PostMapping("/{serverId}/leave")
    public ResponseEntity<Void> leaveServer(
            @PathVariable UUID serverId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "LEAVE_SERVER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        serverService.leaveServer(serverId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 서버 정보 수정 (소유자만 가능)
     */
    @PutMapping("/{serverId}")
    public ResponseEntity<ServerDto.Response> updateServer(
            @PathVariable UUID serverId,
            @Valid @RequestBody ServerDto.UpdateRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "UPDATE_SERVER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ServerDto.Response updatedServer = serverService.updateServer(serverId, request);
        return ResponseEntity.ok(updatedServer);
    }

    /**
     * 서버 삭제 (소유자만 가능)
     */
    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(
            @PathVariable UUID serverId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "DELETE_SERVER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        serverService.deleteServer(serverId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 멤버 추방 (관리자만 가능)
     */
    @DeleteMapping("/{serverId}/members/{userId}")
    public ResponseEntity<Void> kickMember(
            @PathVariable UUID serverId,
            @PathVariable UUID userId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "KICK_MEMBER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        serverService.kickMember(serverId, userId);
        return ResponseEntity.noContent().build();
    }
}