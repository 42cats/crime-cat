package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChatMessage;
import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ServerChannel;
import com.crimecat.backend.chat.dto.ChatMessageDto;
import com.crimecat.backend.chat.repository.ChatMessageRepository;
import com.crimecat.backend.chat.repository.ChatServerRepository;
import com.crimecat.backend.chat.repository.ServerChannelRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatServerRepository chatServerRepository;
    private final ServerChannelRepository serverChannelRepository;

    /**
     * 단일 채팅 메시지 저장
     */
    @Transactional
    public ChatMessageDto.Response saveMessage(ChatMessageDto.Request request, UUID userId, String username) {
        log.debug("Saving chat message from user: {} to server: {}, channel: {}", username, request.getServerId(), request.getChannelId());
        
        ChatServer server = chatServerRepository.findById(request.getServerId())
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
        
        ServerChannel channel = serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(request.getChannelId(), request.getServerId())
                .orElseThrow(ErrorStatus.CHANNEL_NOT_FOUND::asServiceException);
        
        ChatMessage chatMessage = request.toEntity(userId, username, server, channel);
        ChatMessage saved = chatMessageRepository.save(chatMessage);
        
        log.info("Chat message saved: id={}, user={}, server={}, channel={}, content={}", 
                saved.getId(), saved.getUsername(), server.getName(), channel.getName(),
                saved.getContent().length() > 50 ? 
                    saved.getContent().substring(0, 50) + "..." : saved.getContent());
        
        return ChatMessageDto.Response.from(saved);
    }

    /**
     * 배치로 채팅 메시지들 저장 (Signal Server에서 오는 배치 처리)
     */
    @Transactional
    public ChatMessageDto.BatchResponse saveBatchMessages(UUID serverId, UUID channelId, 
            ChatMessageDto.BatchRequest request, WebUser currentUser) {
        
        log.info("Processing batch of {} chat messages for server: {}, channel: {}", 
                request.getMessages().size(), serverId, channelId);
        
        // 서버 및 채널 검증
        ChatServer server = chatServerRepository.findById(serverId)
                .orElseThrow(() -> ErrorStatus.SERVER_NOT_FOUND.asServiceException());
        
        ServerChannel channel = serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(channelId, serverId)
                .orElseThrow(() -> ErrorStatus.CHANNEL_NOT_FOUND.asServiceException());
        
        List<UUID> savedMessageIds = new ArrayList<>();
        int successCount = 0;
        int failedCount = 0;
        
        try {
            // 각 메시지를 개별적으로 저장 (부분 실패 허용)
            for (ChatMessageDto.CreateRequest messageRequest : request.getMessages()) {
                try {
                    ChatMessage message = messageRequest.toEntity(server, channel);
                    ChatMessage savedMessage = chatMessageRepository.save(message);
                    savedMessageIds.add(savedMessage.getId());
                    successCount++;
                    
                    log.debug("Saved message: id={}, user={}, content={}", 
                            savedMessage.getId(), savedMessage.getUsername(),
                            savedMessage.getContent().length() > 50 ? 
                                savedMessage.getContent().substring(0, 50) + "..." : savedMessage.getContent());
                    
                } catch (Exception e) {
                    failedCount++;
                    log.warn("Failed to save message from user {}: {}", 
                            messageRequest.getUsername(), e.getMessage());
                }
            }
            
            log.info("Batch processing completed: {}/{} messages saved successfully", 
                    successCount, request.getMessages().size());
            
            if (failedCount == 0) {
                return ChatMessageDto.BatchResponse.success(request.getMessages().size(), savedMessageIds);
            } else {
                return ChatMessageDto.BatchResponse.partial(request.getMessages().size(), successCount, savedMessageIds);
            }
            
        } catch (Exception e) {
            log.error("Critical error during batch processing", e);
            return ChatMessageDto.BatchResponse.partial(request.getMessages().size(), successCount, savedMessageIds);
        }
    }


    /**
     * 채팅 메시지 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<ChatMessageDto.Response> getChannelMessages(UUID serverId, UUID channelId, Pageable pageable) {
        ChatServer server = chatServerRepository.findById(serverId)
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
        
        ServerChannel channel = serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(channelId, serverId)
                .orElseThrow(ErrorStatus.CHANNEL_NOT_FOUND::asServiceException);
        
        Page<ChatMessage> messages = chatMessageRepository.findByServerIdAndChannelIdOrderByCreatedAtDesc(
                serverId, channelId, pageable);
        return messages.map(ChatMessageDto.Response::from);
    }

    /**
     * 특정 사용자의 메시지 조회
     */
    @Transactional(readOnly = true)
    public Page<ChatMessageDto.Response> getMessagesByUser(UUID serverId, UUID userId, Pageable pageable) {
        ChatServer server = chatServerRepository.findById(serverId)
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
        
        Page<ChatMessage> messages = chatMessageRepository.findByServerIdAndUserIdOrderByCreatedAtDesc(
                serverId, userId, pageable);
        return messages.map(ChatMessageDto.Response::from);
    }

    /**
     * 특정 시간 이후의 메시지 조회 (실시간 동기화용)
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDto.Response> getMessagesSince(UUID serverId, UUID channelId, LocalDateTime since) {
        ChatServer server = chatServerRepository.findById(serverId)
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
        
        ServerChannel channel = serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(channelId, serverId)
                .orElseThrow(ErrorStatus.CHANNEL_NOT_FOUND::asServiceException);
        
        List<ChatMessage> messages = chatMessageRepository.findMessagesSinceByServerAndChannel(
                serverId, channelId, since);
        return messages.stream()
                .map(ChatMessageDto.Response::from)
                .toList();
    }

    /**
     * 최근 N개 메시지 조회 (채팅방 입장시)
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDto.Response> getRecentMessages(UUID serverId, UUID channelId, int limit) {
        ChatServer server = chatServerRepository.findById(serverId)
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
        
        ServerChannel channel = serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(channelId, serverId)
                .orElseThrow(ErrorStatus.CHANNEL_NOT_FOUND::asServiceException);
        
        List<ChatMessage> messages = chatMessageRepository.findRecentMessagesByServerAndChannel(
                serverId, channelId, limit);
        // 시간순으로 정렬 (오래된 것부터)
        return messages.stream()
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .map(ChatMessageDto.Response::from)
                .toList();
    }

    /**
     * 메시지 검색
     */
    @Transactional(readOnly = true)
    public Page<ChatMessageDto.Response> searchMessages(UUID serverId, UUID channelId, String keyword, Pageable pageable) {
        ChatServer server = chatServerRepository.findById(serverId)
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
        
        ServerChannel channel = serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(channelId, serverId)
                .orElseThrow(ErrorStatus.CHANNEL_NOT_FOUND::asServiceException);
        
        Page<ChatMessage> messages = chatMessageRepository.findByServerIdAndChannelIdAndContentContaining(
                serverId, channelId, keyword, pageable);
        return messages.map(ChatMessageDto.Response::from);
    }


    /**
     * 특정 기간의 메시지 수 조회
     */
    @Transactional(readOnly = true)
    public Long getMessageCountBetween(UUID serverId, UUID channelId, LocalDateTime startDate, LocalDateTime endDate) {
        ChatServer server = chatServerRepository.findById(serverId)
                .orElseThrow(ErrorStatus.SERVER_NOT_FOUND::asServiceException);
        
        ServerChannel channel = serverChannelRepository.findByIdAndServerIdAndIsActiveTrue(channelId, serverId)
                .orElseThrow(ErrorStatus.CHANNEL_NOT_FOUND::asServiceException);
        
        return chatMessageRepository.countByServerIdAndChannelIdAndCreatedAtBetween(
                serverId, channelId, startDate, endDate);
    }
}