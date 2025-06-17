package com.crimecat.backend.chat.controller;

import com.crimecat.backend.chat.dto.BatchChatMessageDto;
import com.crimecat.backend.chat.dto.ChatMessageDto;
import com.crimecat.backend.chat.service.ChatMessageService;
import com.crimecat.backend.utils.AuthenticationUtil;
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

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Validated
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    /**
     * 단일 채팅 메시지 저장
     */
    @PostMapping("/messages")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ChatMessageDto.Response> createMessage(
            @Valid @RequestBody ChatMessageDto.Request request) {
        
        String userId = AuthenticationUtil.getCurrentUserId();
        String username = AuthenticationUtil.getCurrentUsername();
        
        log.debug("Creating chat message from user: {}", username);
        
        ChatMessageDto.Response response = chatMessageService.saveMessage(request, userId, username);
        
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
     * 채팅 메시지 목록 조회 (페이징)
     */
    @GetMapping("/messages")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<ChatMessageDto.Response>> getMessages(
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) 
            Pageable pageable) {
        
        Page<ChatMessageDto.Response> messages = chatMessageService.getMessages(pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 특정 사용자의 메시지 조회
     */
    @GetMapping("/messages/user/{userId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<ChatMessageDto.Response>> getMessagesByUser(
            @PathVariable String userId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) 
            Pageable pageable) {
        
        Page<ChatMessageDto.Response> messages = chatMessageService.getMessagesByUser(userId, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 최근 메시지 조회 (채팅방 입장시)
     */
    @GetMapping("/messages/recent")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ChatMessageDto.Response>> getRecentMessages(
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
        
        List<ChatMessageDto.Response> messages = chatMessageService.getRecentMessages(limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * 특정 시간 이후의 메시지 조회 (실시간 동기화용)
     */
    @GetMapping("/messages/since")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ChatMessageDto.Response>> getMessagesSince(
            @RequestParam LocalDateTime since) {
        
        List<ChatMessageDto.Response> messages = chatMessageService.getMessagesSince(since);
        return ResponseEntity.ok(messages);
    }

    /**
     * 메시지 검색
     */
    @GetMapping("/messages/search")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<ChatMessageDto.Response>> searchMessages(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) 
            Pageable pageable) {
        
        Page<ChatMessageDto.Response> messages = chatMessageService.searchMessages(keyword, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 현재 사용자의 메시지 조회
     */
    @GetMapping("/messages/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<ChatMessageDto.Response>> getMyMessages(
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) 
            Pageable pageable) {
        
        String userId = AuthenticationUtil.getCurrentUserId();
        Page<ChatMessageDto.Response> messages = chatMessageService.getMessagesByUser(userId, pageable);
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
     * 특정 기간의 메시지 수 조회 (관리자용)
     */
    @GetMapping("/messages/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getMessageCount(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        
        Long count = chatMessageService.getMessageCountBetween(startDate, endDate);
        return ResponseEntity.ok(count);
    }

    /**
     * 헬스체크 엔드포인트
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Chat service is healthy");
    }
}