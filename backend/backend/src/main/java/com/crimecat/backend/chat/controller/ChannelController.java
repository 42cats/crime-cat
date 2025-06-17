package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ChannelDto;
import com.crimecat.backend.chat.service.ChannelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/servers/{serverId}/channels")
@RequiredArgsConstructor
@Slf4j
public class ChannelController {

    private final ChannelService channelService;

    /**
     * 채널 생성 (서버 관리자만 가능)
     */
    @PostMapping
    public ResponseEntity<ChannelDto.Response> createChannel(
            @PathVariable Long serverId,
            @Valid @RequestBody ChannelDto.CreateRequest request) {
        ChannelDto.Response createdChannel = channelService.createChannel(serverId, request);
        return ResponseEntity.ok(createdChannel);
    }

    /**
     * 서버의 모든 채널 조회
     */
    @GetMapping
    public ResponseEntity<List<ChannelDto.Response>> getServerChannels(@PathVariable Long serverId) {
        List<ChannelDto.Response> channels = channelService.getServerChannels(serverId);
        return ResponseEntity.ok(channels);
    }

    /**
     * 특정 채널 조회
     */
    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelDto.Response> getChannel(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        ChannelDto.Response channel = channelService.getChannel(serverId, channelId);
        return ResponseEntity.ok(channel);
    }

    /**
     * 채널 정보 수정 (서버 관리자만 가능)
     */
    @PutMapping("/{channelId}")
    public ResponseEntity<ChannelDto.Response> updateChannel(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @Valid @RequestBody ChannelDto.UpdateRequest request) {
        ChannelDto.Response updatedChannel = channelService.updateChannel(serverId, channelId, request);
        return ResponseEntity.ok(updatedChannel);
    }

    /**
     * 채널 삭제 (서버 관리자만 가능)
     */
    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        channelService.deleteChannel(serverId, channelId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 채널 입장
     */
    @PostMapping("/{channelId}/join")
    public ResponseEntity<ChannelDto.Response> joinChannel(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        ChannelDto.Response channel = channelService.joinChannel(serverId, channelId);
        return ResponseEntity.ok(channel);
    }

    /**
     * 채널 탈퇴
     */
    @PostMapping("/{channelId}/leave")
    public ResponseEntity<Void> leaveChannel(
            @PathVariable Long serverId,
            @PathVariable Long channelId) {
        channelService.leaveChannel(serverId, channelId);
        return ResponseEntity.noContent().build();
    }
}