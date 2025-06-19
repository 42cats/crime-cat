package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ChannelDto;
import com.crimecat.backend.chat.service.ChannelService;
import com.crimecat.backend.utils.SignalServerAuthUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/signal/servers/{serverId}/channels")
@RequiredArgsConstructor
@Slf4j
public class ChannelController {

    private final ChannelService channelService;
    private final SignalServerAuthUtil signalServerAuthUtil;

    /**
     * 채널 생성 (서버 관리자만 가능)
     */
    @PostMapping
    public ResponseEntity<ChannelDto.Response> createChannel(
            @PathVariable UUID serverId,
            @Valid @RequestBody ChannelDto.CreateRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "CREATE_CHANNEL");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ChannelDto.Response createdChannel = channelService.createChannel(serverId, request, currentUser);
        return ResponseEntity.ok(createdChannel);
    }

    /**
     * 서버의 모든 채널 조회
     */
    @GetMapping
    public ResponseEntity<List<ChannelDto.Response>> getServerChannels(
            @PathVariable UUID serverId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_SERVER_CHANNELS");
        List<ChannelDto.Response> channels = channelService.getServerChannels(serverId);
        return ResponseEntity.ok(channels);
    }

    /**
     * 특정 채널 조회
     */
    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelDto.Response> getChannel(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "GET_CHANNEL");
        ChannelDto.Response channel = channelService.getChannel(serverId, channelId);
        return ResponseEntity.ok(channel);
    }

    /**
     * 채널 정보 수정 (서버 관리자만 가능)
     */
    @PutMapping("/{channelId}")
    public ResponseEntity<ChannelDto.Response> updateChannel(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @Valid @RequestBody ChannelDto.UpdateRequest request,
            HttpServletRequest httpRequest) {
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "UPDATE_CHANNEL");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        ChannelDto.Response updatedChannel = channelService.updateChannel(serverId, channelId, request);
        return ResponseEntity.ok(updatedChannel);
    }

    /**
     * 채널 삭제 (서버 관리자만 가능)
     */
    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "DELETE_CHANNEL");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        channelService.deleteChannel(serverId, channelId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 채널 입장
     */
    @PostMapping("/{channelId}/join")
    public ResponseEntity<ChannelDto.Response> joinChannel(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "JOIN_CHANNEL");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        ChannelDto.Response channel = channelService.joinChannel(serverId, channelId, currentUser);
        return ResponseEntity.ok(channel);
    }

    /**
     * 채널 탈퇴
     */
    @PostMapping("/{channelId}/leave")
    public ResponseEntity<Void> leaveChannel(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            HttpServletRequest request) {
        signalServerAuthUtil.logSignalServerRequest(request, "LEAVE_CHANNEL");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
        channelService.leaveChannel(serverId, channelId);
        return ResponseEntity.noContent().build();
    }
}