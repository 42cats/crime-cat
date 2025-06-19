package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.ChatMessageDto;
import com.crimecat.backend.chat.service.ChatMessageService;
import com.crimecat.backend.utils.SignalServerAuthUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/signal/servers/{serverId}/channels/{channelId}/messages")
@RequiredArgsConstructor
@Validated
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final SignalServerAuthUtil signalServerAuthUtil;

    /**
     * 메시지 전송
     */
    @PostMapping
    public ResponseEntity<ChatMessageDto.Response> sendMessage(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @Valid @RequestBody ChatMessageDto.Request request,
            HttpServletRequest httpRequest) {
        
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "SEND_MESSAGE");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        UUID currentUserId = currentUser.getId();
        String username = currentUser.getNickname();
        
        log.info("Sending message to server: {}, channel: {}, user: {}", serverId, channelId, username);
        
        ChatMessageDto.Response response = chatMessageService.saveMessage(request, currentUserId, username);
        return ResponseEntity.ok(response);
    }

    /**
     * 배치로 채팅 메시지들 저장 (시그널 서버 전용)
     */
    @PostMapping("/batch")
    public ResponseEntity<ChatMessageDto.BatchResponse> createBatchMessages(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @Valid @RequestBody ChatMessageDto.BatchRequest request,
            HttpServletRequest httpRequest) {
        
        signalServerAuthUtil.logSignalServerRequest(httpRequest, "BATCH_MESSAGES");
        WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
        
        log.info("Processing batch request from signal-server: {} messages for server: {}, channel: {}", 
                request.getMessages().size(), serverId, channelId);
        
        ChatMessageDto.BatchResponse response = chatMessageService.saveBatchMessages(serverId, channelId, request, currentUser);
        
        if (response.getFailedCount() > 0) {
            log.warn("Batch processing completed with errors: {}/{} failed", 
                    response.getFailedCount(), response.getTotalMessages());
            return ResponseEntity.status(207).body(response); // 207 Multi-Status
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 채널의 메시지 목록 조회 (페이징)
     */
    @GetMapping
    public ResponseEntity<Page<ChatMessageDto.Response>> getChannelMessages(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            HttpServletRequest request) {
        
        signalServerAuthUtil.logSignalServerRequest(request, "GET_CHANNEL_MESSAGES");
        Page<ChatMessageDto.Response> messages = chatMessageService.getChannelMessages(serverId, channelId, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 특정 사용자의 메시지 조회 (서버 내)
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<Page<ChatMessageDto.Response>> getUserMessages(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            HttpServletRequest request) {
        
        signalServerAuthUtil.logSignalServerRequest(request, "GET_USER_MESSAGES");
        Page<ChatMessageDto.Response> messages = chatMessageService.getMessagesByUser(serverId, userId, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 최근 메시지 조회 (채팅방 입장 시)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<ChatMessageDto.Response>> getRecentMessages(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit,
            HttpServletRequest request) {
        
        signalServerAuthUtil.logSignalServerRequest(request, "GET_RECENT_MESSAGES");
        List<ChatMessageDto.Response> messages = chatMessageService.getRecentMessages(serverId, channelId, limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * 특정 시간 이후의 메시지 조회 (실시간 동기화용)
     */
    @GetMapping("/since")
    public ResponseEntity<List<ChatMessageDto.Response>> getMessagesSince(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @RequestParam LocalDateTime since,
            HttpServletRequest request) {
        
        signalServerAuthUtil.logSignalServerRequest(request, "GET_MESSAGES_SINCE");
        List<ChatMessageDto.Response> messages = chatMessageService.getMessagesSince(serverId, channelId, since);
        return ResponseEntity.ok(messages);
    }

    /**
     * 메시지 검색
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ChatMessageDto.Response>> searchMessages(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            HttpServletRequest request) {
        
        signalServerAuthUtil.logSignalServerRequest(request, "SEARCH_MESSAGES");
        Page<ChatMessageDto.Response> messages = chatMessageService.searchMessages(serverId, channelId, keyword, pageable);
        return ResponseEntity.ok(messages);
    }


    /**
     * 배치 처리 통계 조회 (관리자용)
     */
    @GetMapping("/batch/stats")
    public ResponseEntity<String> getBatchStats(HttpServletRequest request) {
        
        signalServerAuthUtil.logSignalServerRequest(request, "GET_BATCH_STATS");
        // TODO: 배치 통계 기능 구현 예정
        return ResponseEntity.ok("Batch stats not implemented yet");
    }

    /**
     * 특정 기간의 메시지 수 조회
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getMessageCount(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            HttpServletRequest request) {
        
        signalServerAuthUtil.logSignalServerRequest(request, "GET_MESSAGE_COUNT");
        Long count = chatMessageService.getMessageCountBetween(serverId, channelId, startDate, endDate);
        return ResponseEntity.ok(count);
    }

}