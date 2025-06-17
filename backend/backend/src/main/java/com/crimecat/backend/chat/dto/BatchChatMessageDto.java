package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ChatMessage;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class BatchChatMessageDto {

    @Getter
    @Builder
    public static class BatchRequest {
        @NotNull
        @NotEmpty
        @Size(max = 100, message = "배치 크기는 100개를 초과할 수 없습니다")
        @Valid
        private List<MessageRequest> messages;

        public List<ChatMessage> toEntities() {
            return messages.stream()
                    .map(MessageRequest::toEntity)
                    .collect(Collectors.toList());
        }
    }

    @Getter
    @Builder
    public static class MessageRequest {
        @NotNull
        @NotEmpty
        private String userId;
        
        @NotNull
        @NotEmpty
        private String username;
        
        @NotNull
        @NotEmpty
        @Size(max = 2000, message = "메시지는 2000자를 초과할 수 없습니다")
        private String content;
        
        private ChatMessage.MessageType messageType;
        
        private LocalDateTime timestamp;

        public ChatMessage toEntity() {
            return ChatMessage.builder()
                    .userId(UUID.fromString(userId))
                    .username(username)
                    .content(content)
                    .messageType(messageType != null ? messageType : ChatMessage.MessageType.TEXT)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class BatchResponse {
        private Integer totalMessages;
        private Integer successCount;
        private Integer failureCount;
        private List<String> errors;
        private Long processingTimeMs;

        public static BatchResponse success(int totalMessages, long processingTimeMs) {
            return BatchResponse.builder()
                    .totalMessages(totalMessages)
                    .successCount(totalMessages)
                    .failureCount(0)
                    .processingTimeMs(processingTimeMs)
                    .build();
        }

        public static BatchResponse partial(int totalMessages, int successCount, 
                                          List<String> errors, long processingTimeMs) {
            return BatchResponse.builder()
                    .totalMessages(totalMessages)
                    .successCount(successCount)
                    .failureCount(totalMessages - successCount)
                    .errors(errors)
                    .processingTimeMs(processingTimeMs)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class BatchStats {
        private Long totalBatchesProcessed;
        private Long totalMessagesProcessed;
        private Double averageProcessingTimeMs;
        private LocalDateTime lastProcessedAt;
        private Integer currentHourMessageCount;
    }
}