package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ChatMessage;
import com.crimecat.backend.chat.domain.ChatServer;
import com.crimecat.backend.chat.domain.ServerChannel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ChatMessageDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotNull(message = "서버 ID는 필수입니다")
        private UUID serverId;

        @NotNull(message = "채널 ID는 필수입니다")
        private UUID channelId;

        @NotBlank(message = "메시지 내용은 필수입니다")
        @Size(max = 2000, message = "메시지는 2000자를 초과할 수 없습니다")
        private String content;

        @Builder.Default
        private ChatMessage.MessageType messageType = ChatMessage.MessageType.TEXT;

        public ChatMessage toEntity(UUID userId, String username, ChatServer server, ServerChannel channel) {
            return ChatMessage.builder()
                    .server(server)
                    .channel(channel)
                    .userId(userId)
                    .username(username)
                    .content(content)
                    .messageType(messageType != null ? messageType : ChatMessage.MessageType.TEXT)
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private UUID serverId;
        private String serverName;
        private UUID channelId;
        private String channelName;
        private UUID userId;
        private String username; 
        private String content;
        private ChatMessage.MessageType messageType;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(ChatMessage message) {
            return Response.builder()
                    .id(message.getId())
                    .serverId(message.getServer().getId())
                    .serverName(message.getServer().getName())
                    .channelId(message.getChannel().getId())
                    .channelName(message.getChannel().getName())
                    .userId(message.getUserId())
                    .username(message.getUsername())
                    .content(message.getContent())
                    .messageType(message.getMessageType())
                    .createdAt(message.getCreatedAt())
                    .updatedAt(message.getUpdatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RealtimeMessage {
        private UUID serverId;
        private UUID channelId;
        private UUID userId;
        private String username;
        private String content;
        private ChatMessage.MessageType messageType;
        private LocalDateTime timestamp;

        public static RealtimeMessage from(ChatMessage message) {
            return RealtimeMessage.builder()
                    .serverId(message.getServer().getId())
                    .channelId(message.getChannel().getId())
                    .userId(message.getUserId())
                    .username(message.getUsername())
                    .content(message.getContent())
                    .messageType(message.getMessageType())
                    .timestamp(message.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageHistory {
        private UUID serverId;
        private UUID channelId;
        private int page;
        private int size;
        private LocalDateTime beforeTime;
        private LocalDateTime afterTime;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageSearch {
        private UUID serverId;
        private UUID channelId;
        @NotBlank(message = "검색 키워드는 필수입니다")
        private String keyword;
        private int page;
        private int size;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChannelPreview {
        private UUID channelId;
        private String channelName;
        private String lastMessageContent;
        private String lastMessageUsername;
        private LocalDateTime lastMessageTime;
        private Long unreadCount;           // ✅ UUID → Long 타입으로 수정
        private ChatMessage.MessageType lastMessageType;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServerActivity {
        private UUID serverId;
        private String serverName;
        private Long totalMessages;         // ✅ UUID → Long 타입으로 수정
        private Long todayMessages;         // ✅ UUID → Long 타입으로 수정
        private Long activeChannels;        // ✅ UUID → Long 타입으로 수정
        private LocalDateTime lastActivity;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserMessageStats {
        private UUID userId;
        private String username;
        private Long messageCount;          // ✅ UUID → Long 타입으로 수정
        private LocalDateTime lastMessageTime;
        private Long serverMessageCount;    // ✅ UUID → Long 타입으로 수정
    }

    // === Batch Message Processing DTOs ===

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchRequest {
        @NotNull(message = "메시지 목록은 필수입니다")
        @Size(min = 1, max = 100, message = "배치 크기는 1-100개 사이여야 합니다")
        @Valid
        private List<CreateRequest> messages;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "서버 ID는 필수입니다")
        private UUID serverId;

        @NotNull(message = "채널 ID는 필수입니다")
        private UUID channelId;

        @NotNull(message = "사용자 ID는 필수입니다")
        private UUID userId;

        @NotBlank(message = "사용자명은 필수입니다")
        private String username;

        @NotBlank(message = "메시지 내용은 필수입니다")
        @Size(max = 2000, message = "메시지는 2000자를 초과할 수 없습니다")
        private String content;

        @Builder.Default
        private String messageType = "text";

        private LocalDateTime timestamp;

        public ChatMessage toEntity(ChatServer server, ServerChannel channel) {
            return ChatMessage.builder()
                    .server(server)
                    .channel(channel)
                    .userId(userId)
                    .username(username)
                    .content(content)
                    .messageType(ChatMessage.MessageType.valueOf(messageType.toUpperCase()))
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchResponse {
        private int totalMessages;
        private int successCount;
        private int failedCount;
        private List<UUID> savedMessageIds;
        private LocalDateTime processedAt;
        private String status;

        public static BatchResponse success(int totalMessages, List<UUID> savedMessageIds) {
            return BatchResponse.builder()
                    .totalMessages(totalMessages)
                    .successCount(totalMessages)
                    .failedCount(0)
                    .savedMessageIds(savedMessageIds)
                    .processedAt(LocalDateTime.now())
                    .status("SUCCESS")
                    .build();
        }

        public static BatchResponse partial(int totalMessages, int successCount, List<UUID> savedMessageIds) {
            return BatchResponse.builder()
                    .totalMessages(totalMessages)
                    .successCount(successCount)
                    .failedCount(totalMessages - successCount)
                    .savedMessageIds(savedMessageIds)
                    .processedAt(LocalDateTime.now())
                    .status("PARTIAL_SUCCESS")
                    .build();
        }
    }
}