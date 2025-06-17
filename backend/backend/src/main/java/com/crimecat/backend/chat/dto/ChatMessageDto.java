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
import java.time.LocalDateTime;
import java.util.UUID;

public class ChatMessageDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotNull(message = "서버 ID는 필수입니다")
        private Long serverId;

        @NotNull(message = "채널 ID는 필수입니다")
        private Long channelId;

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
        private Long id;
        private Long serverId;
        private String serverName;
        private Long channelId;
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
        private Long serverId;
        private Long channelId;
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
        private Long serverId;
        private Long channelId;
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
        private Long serverId;
        private Long channelId;
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
        private Long channelId;
        private String channelName;
        private String lastMessageContent;
        private String lastMessageUsername;
        private LocalDateTime lastMessageTime;
        private Long unreadCount;
        private ChatMessage.MessageType lastMessageType;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServerActivity {
        private Long serverId;
        private String serverName;
        private Long totalMessages;
        private Long todayMessages;
        private Long activeChannels;
        private LocalDateTime lastActivity;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserMessageStats {
        private UUID userId;
        private String username;
        private Long messageCount;
        private LocalDateTime lastMessageTime;
        private Long serverMessageCount;
    }
}