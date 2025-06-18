package com.crimecat.backend.chat.service;

import com.crimecat.backend.chat.domain.ChatMessage;
import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ServerChannel;
import com.crimecat.backend.chat.dto.BatchChatMessageDto;
import com.crimecat.backend.chat.dto.ChatMessageDto;
import com.crimecat.backend.chat.repository.ChatMessageRepository;
import com.crimecat.backend.chat.repository.ChatServerRepository;
import com.crimecat.backend.chat.repository.ServerChannelRepository;
import com.crimecat.backend.exception.ErrorStatus;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatServerRepository chatServerRepository;
    private final ServerChannelRepository serverChannelRepository;
    
    // 배치 처리 통계용
    private final AtomicLong totalBatchesProcessed = new AtomicLong(0);
    private final AtomicLong totalMessagesProcessed = new AtomicLong(0);
    private volatile LocalDateTime lastProcessedAt;
    private final List<Long> processingTimes = new ArrayList<>();

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
     * 배치로 채팅 메시지들 저장 (Redis에서 오는 배치 처리)
     */
    @Transactional
    public BatchChatMessageDto.BatchResponse saveBatchMessages(BatchChatMessageDto.BatchRequest request) {
        long startTime = System.currentTimeMillis();
        
        log.info("Processing batch of {} chat messages", request.getMessages().size());
        
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        
        try {
            // 엔티티 변환
            List<ChatMessage> messages = request.toEntities();
            
            // 배치 검증
            validateBatchMessages(messages, errors);
            
            if (!errors.isEmpty()) {
                log.warn("Batch validation failed with {} errors", errors.size());
                long processingTime = System.currentTimeMillis() - startTime;
                return BatchChatMessageDto.BatchResponse.partial(
                    request.getMessages().size(), 0, errors, processingTime);
            }
            
            // 배치 저장 - JPA의 batch insert 활용
            List<ChatMessage> savedMessages = chatMessageRepository.saveAll(messages);
            successCount = savedMessages.size();
            
            // 통계 업데이트
            updateBatchStats(savedMessages.size(), startTime);
            
            long processingTime = System.currentTimeMillis() - startTime;
            
            log.info("Successfully processed batch: {} messages in {}ms", 
                    successCount, processingTime);
            
            return BatchChatMessageDto.BatchResponse.success(successCount, processingTime);
            
        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("Error processing chat message batch", e);
            
            errors.add("Batch processing failed: " + e.getMessage());
            return BatchChatMessageDto.BatchResponse.partial(
                request.getMessages().size(), successCount, errors, processingTime);
        }
    }

    /**
     * 배치 메시지 검증
     */
    private void validateBatchMessages(List<ChatMessage> messages, List<String> errors) {
        for (int i = 0; i < messages.size(); i++) {
            ChatMessage message = messages.get(i);
            
            if (message.getUserId() == null || message.getUserId().toString().trim().isEmpty()) {
                errors.add(String.format("Message %d: userId is required", i));
            }
            
            if (message.getUsername() == null || message.getUsername().trim().isEmpty()) {
                errors.add(String.format("Message %d: username is required", i));
            }
            
            if (message.getContent() == null || message.getContent().trim().isEmpty()) {
                errors.add(String.format("Message %d: content is required", i));
            }
            
            if (message.getContent() != null && message.getContent().length() > 2000) {
                errors.add(String.format("Message %d: content too long (%d characters)", 
                          i, message.getContent().length()));
            }
            
            // 추가 비즈니스 규칙 검증 가능
        }
    }

    /**
     * 배치 처리 통계 업데이트
     */
    private synchronized void updateBatchStats(int messageCount, long startTime) {
        totalBatchesProcessed.incrementAndGet();
        totalMessagesProcessed.addAndGet(messageCount);
        lastProcessedAt = LocalDateTime.now();
        
        long processingTime = System.currentTimeMillis() - startTime;
        processingTimes.add(processingTime);
        
        // 최근 100개 처리 시간만 유지
        if (processingTimes.size() > 100) {
            processingTimes.remove(0);
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
     * 배치 처리 통계 조회
     */
    public BatchChatMessageDto.BatchStats getBatchStats() {
        double averageProcessingTime = processingTimes.isEmpty() ? 0.0 :
            processingTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            
        return BatchChatMessageDto.BatchStats.builder()
                .totalBatchesProcessed(totalBatchesProcessed.get())
                .totalMessagesProcessed(totalMessagesProcessed.get())
                .averageProcessingTimeMs(averageProcessingTime)
                .lastProcessedAt(lastProcessedAt)
                .build();
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