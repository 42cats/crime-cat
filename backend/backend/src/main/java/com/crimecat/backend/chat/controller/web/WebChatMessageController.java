package com.crimecat.backend.chat.controller.web;

import com.crimecat.backend.chat.dto.ChatMessageDto;
import com.crimecat.backend.chat.service.ChatMessageService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/servers/{serverId}/channels/{channelId}/messages")
@RequiredArgsConstructor
@Validated
public class WebChatMessageController {

    private final ChatMessageService chatMessageService;

    /**
     * 메시지 전송
     */
    @PostMapping
    public ResponseEntity<ChatMessageDto.Response> sendMessage(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @Valid @RequestBody ChatMessageDto.Request request) {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UUID currentUserId = currentUser.getId();
        String username = currentUser.getNickname();
        
        log.info("Sending message to server: {}, channel: {}, user: {}", serverId, channelId, username);
        
        ChatMessageDto.Response response = chatMessageService.saveMessage(request, currentUserId, username);
        return ResponseEntity.ok(response);
    }

    /**
     * 채널의 메시지 목록 조회 (페이징)
     */
    @GetMapping
    public ResponseEntity<Page<ChatMessageDto.Response>> getChannelMessages(
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
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
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
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
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
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
            @RequestParam LocalDateTime since) {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
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
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
        Page<ChatMessageDto.Response> messages = chatMessageService.searchMessages(serverId, channelId, keyword, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 배치 처리 통계 조회 (관리자용)
     */
    @GetMapping("/batch/stats")
    public ResponseEntity<String> getBatchStats() {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.ADMIN);
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
            @RequestParam LocalDateTime endDate) {
        
        AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
        Long count = chatMessageService.getMessageCountBetween(serverId, channelId, startDate, endDate);
        return ResponseEntity.ok(count);
    }
}