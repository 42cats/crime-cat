package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ChannelMemberDto;
import com.crimecat.backend.chat.service.ChannelMemberService;
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
@RequestMapping("/api/v1/servers/{serverId}/channels/{channelId}/members")
@RequiredArgsConstructor
@Slf4j
public class ChannelMemberController {

    private final ChannelMemberService channelMemberService;

    /**
     * 채널의 모든 멤버 조회
     */
    @GetMapping
    public ResponseEntity<List<ChannelMemberDto>> getAllMembers(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        List<ChannelMemberDto> members = channelMemberService.getAllMembers(serverId, channelId);
        return ResponseEntity.ok(members);
    }

    /**
     * 채널의 멤버를 페이징으로 조회
     */
    @GetMapping("/page")
    public ResponseEntity<Page<ChannelMemberDto>> getMembersByPage(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ChannelMemberDto> members = channelMemberService.getMembersByPage(serverId, channelId, pageable);
        return ResponseEntity.ok(members);
    }

    /**
     * 특정 채널 멤버 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ChannelMemberDto> getMember(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @PathVariable UUID userId) {
        ChannelMemberDto member = channelMemberService.getMember(serverId, channelId, userId);
        return ResponseEntity.ok(member);
    }

    /**
     * 채널 입장
     */
    @PostMapping("/join")
    public ResponseEntity<ChannelMemberDto> joinChannel(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        ChannelMemberDto member = channelMemberService.joinChannel(serverId, channelId);
        return ResponseEntity.ok(member);
    }

    /**
     * 채널 탈퇴
     */
    @PostMapping("/leave")
    public ResponseEntity<Void> leaveChannel(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        channelMemberService.leaveChannel(serverId, channelId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 채널 멤버 역할 변경 (모더레이터 또는 서버 관리자만 가능)
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<ChannelMemberDto> updateMemberRole(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @PathVariable UUID userId,
            @Valid @RequestBody ChannelMemberDto.RoleUpdateRequest request) {
        ChannelMemberDto updatedMember = channelMemberService.updateMemberRole(serverId, channelId, userId, request);
        return ResponseEntity.ok(updatedMember);
    }

    /**
     * 채널 멤버 추방 (모더레이터 또는 서버 관리자만 가능)
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> kickMember(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @PathVariable UUID userId) {
        channelMemberService.kickMember(serverId, channelId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 채널 멤버 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<ChannelMemberDto.Statistics> getChannelStatistics(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        ChannelMemberDto.Statistics statistics = channelMemberService.getChannelStatistics(serverId, channelId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * 채널 활동 업데이트 (내부 API용)
     */
    @PostMapping("/{userId}/activity")
    public ResponseEntity<Void> updateActivity(
            @PathVariable Long channelId,
            @PathVariable UUID userId) {
        channelMemberService.updateActivity(channelId, userId);
        return ResponseEntity.noContent().build();
    }
}