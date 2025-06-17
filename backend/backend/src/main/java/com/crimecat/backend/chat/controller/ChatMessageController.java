package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.BatchChatMessageDto;
import com.crimecat.backend.chat.dto.ChatMessageDto;
import com.crimecat.backend.chat.service.ChatMessageService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/servers/{serverId}/channels/{channelId}/messages")
@RequiredArgsConstructor
@Validated
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    /**
     * 메시지 전송
     */
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ChatMessageDto.Response> sendMessage(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @Valid @RequestBody ChatMessageDto.Request request) {
        
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UUID currentUserId = currentUser.getId();
        String username = currentUser.getNickname();
        
        log.info("Sending message to server: {}, channel: {}, user: {}", serverId, channelId, username);
        
        ChatMessageDto.Response response = chatMessageService.saveMessage(request, currentUserId, username);
        return ResponseEntity.ok(response);
    }

    /**
     * 배치로 채팅 메시지들 저장 (시그널 서버 전용)
     */
    @PostMapping("/messages/batch")
    public ResponseEntity<BatchChatMessageDto.BatchResponse> createBatchMessages(
            @Valid @RequestBody BatchChatMessageDto.BatchRequest request,
            @RequestHeader(value = "X-Service-Name", required = false) String serviceName) {
        
        // 시그널 서버에서만 접근 가능하도록 제한
        if (!"signal-server".equals(serviceName)) {
            log.warn("Unauthorized batch request from service: {}", serviceName);
            return ResponseEntity.status(403).build();
        }
        
        log.info("Processing batch request from signal-server: {} messages", 
                request.getMessages().size());
        
        BatchChatMessageDto.BatchResponse response = chatMessageService.saveBatchMessages(request);
        
        if (response.getFailureCount() > 0) {
            log.warn("Batch processing completed with errors: {}/{} failed", 
                    response.getFailureCount(), response.getTotalMessages());
            return ResponseEntity.status(207).body(response); // 207 Multi-Status
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 채널의 메시지 목록 조회 (페이징)
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<ChatMessageDto.Response>> getChannelMessages(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<ChatMessageDto.Response> messages = chatMessageService.getChannelMessages(serverId, channelId, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 특정 사용자의 메시지 조회 (서버 내)
     */
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<ChatMessageDto.Response>> getUserMessages(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<ChatMessageDto.Response> messages = chatMessageService.getMessagesByUser(serverId, userId, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 최근 메시지 조회 (채팅방 입장 시)
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ChatMessageDto.Response>> getRecentMessages(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
        
        List<ChatMessageDto.Response> messages = chatMessageService.getRecentMessages(serverId, channelId, limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * 특정 시간 이후의 메시지 조회 (실시간 동기화용)
     */
    @GetMapping("/since")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ChatMessageDto.Response>> getMessagesSince(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @RequestParam LocalDateTime since) {
        
        List<ChatMessageDto.Response> messages = chatMessageService.getMessagesSince(serverId, channelId, since);
        return ResponseEntity.ok(messages);
    }

    /**
     * 메시지 검색
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<ChatMessageDto.Response>> searchMessages(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<ChatMessageDto.Response> messages = chatMessageService.searchMessages(serverId, channelId, keyword, pageable);
        return ResponseEntity.ok(messages);
    }


    /**
     * 배치 처리 통계 조회 (관리자용)
     */
    @GetMapping("/batch/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BatchChatMessageDto.BatchStats> getBatchStats() {
        
        BatchChatMessageDto.BatchStats stats = chatMessageService.getBatchStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 특정 기간의 메시지 수 조회
     */
    @GetMapping("/count")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Long> getMessageCount(
            @PathVariable Long serverId,
            @PathVariable Long channelId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        
        Long count = chatMessageService.getMessageCountBetween(serverId, channelId, startDate, endDate);
        return ResponseEntity.ok(count);
    }

}