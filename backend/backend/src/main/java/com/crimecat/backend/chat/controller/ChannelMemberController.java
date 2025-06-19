package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ChannelMemberDto;
import com.crimecat.backend.chat.service.ChannelMemberService;
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
@RequestMapping("/api/v1/signal/servers/{serverId}/channels/{channelId}/members")
@RequiredArgsConstructor
@Slf4j
public class ChannelMemberController {

    private final ChannelMemberService channelMemberService;
    private final SignalServerAuthUtil signalServerAuthUtil;

    /**
     * 채널의 모든 멤버 조회
     */
    @GetMapping
    public ResponseEntity<List<ChannelMemberDto>> getAllMembers(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_CHANNEL_ALL_MEMBERS");
        List<ChannelMemberDto> members = channelMemberService.getAllMembers(serverId, channelId);
        return ResponseEntity.ok(members);
    }

    /**
     * 채널의 멤버를 페이징으로 조회
     */
    @GetMapping("/page")
    public ResponseEntity<Page<ChannelMemberDto>> getMembersByPage(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_CHANNEL_MEMBERS_BY_PAGE");
        Page<ChannelMemberDto> members = channelMemberService.getMembersByPage(serverId, channelId, pageable);
        return ResponseEntity.ok(members);
    }

    /**
     * 특정 채널 멤버 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ChannelMemberDto> getMember(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @PathVariable UUID userId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_CHANNEL_MEMBER");
        ChannelMemberDto member = channelMemberService.getMember(serverId, channelId, userId);
        return ResponseEntity.ok(member);
    }

    /**
     * 채널 입장
     */
    @PostMapping("/join")
    public ResponseEntity<ChannelMemberDto> joinChannel(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "JOIN_CHANNEL_MEMBER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        ChannelMemberDto member = channelMemberService.joinChannel(serverId, channelId);
        return ResponseEntity.ok(member);
    }

    /**
     * 채널 탈퇴
     */
    @PostMapping("/leave")
    public ResponseEntity<Void> leaveChannel(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "LEAVE_CHANNEL_MEMBER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        channelMemberService.leaveChannel(serverId, channelId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 채널 멤버 역할 변경 (모더레이터 또는 서버 관리자만 가능)
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<ChannelMemberDto> updateMemberRole(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @PathVariable UUID userId,
            @Valid @RequestBody ChannelMemberDto.RoleUpdateRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "UPDATE_CHANNEL_MEMBER_ROLE");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ChannelMemberDto updatedMember = channelMemberService.updateMemberRole(serverId, channelId, userId, request);
        return ResponseEntity.ok(updatedMember);
    }

    /**
     * 채널 멤버 추방 (모더레이터 또는 서버 관리자만 가능)
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> kickMember(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @PathVariable UUID userId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "KICK_CHANNEL_MEMBER");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        channelMemberService.kickMember(serverId, channelId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 채널 멤버 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<ChannelMemberDto.Statistics> getChannelStatistics(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_CHANNEL_STATISTICS");
        ChannelMemberDto.Statistics statistics = channelMemberService.getChannelStatistics(serverId, channelId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * 채널 활동 업데이트 (내부 API용)
     */
    @PostMapping("/{userId}/activity")
    public ResponseEntity<Void> updateActivity(
            @PathVariable UUID channelId,
            @PathVariable UUID userId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "UPDATE_CHANNEL_ACTIVITY");
        channelMemberService.updateActivity(channelId, userId);
        return ResponseEntity.noContent().build();
    }
}