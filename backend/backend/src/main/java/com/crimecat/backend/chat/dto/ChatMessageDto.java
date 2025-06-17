package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ChatMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class ChatMessageDto {

    @Getter
    @Builder
    public static class Request {
        private String content;
        private ChatMessage.MessageType messageType;

        public ChatMessage toEntity(String userId, String username) {
            return ChatMessage.builder()
                    .userId(userId)
                    .username(username)
                    .content(content)
                    .messageType(messageType != null ? messageType : ChatMessage.MessageType.TEXT)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String userId;
        private String username;
        private String content;
        private ChatMessage.MessageType messageType;
        private LocalDateTime createdAt;

        public static Response from(ChatMessage chatMessage) {
            return Response.builder()
                    .id(chatMessage.getId())
                    .userId(chatMessage.getUserId())
                    .username(chatMessage.getUsername())
                    .content(chatMessage.getContent())
                    .messageType(chatMessage.getMessageType())
                    .createdAt(chatMessage.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class RealtimeMessage {
        private String userId;
        private String username;
        private String content;
        private ChatMessage.MessageType messageType;
        private LocalDateTime timestamp;

        public static RealtimeMessage from(ChatMessage chatMessage) {
            return RealtimeMessage.builder()
                    .userId(chatMessage.getUserId())
                    .username(chatMessage.getUsername())
                    .content(chatMessage.getContent())
                    .messageType(chatMessage.getMessageType())
                    .timestamp(chatMessage.getCreatedAt())
                    .build();
        }
    }
}