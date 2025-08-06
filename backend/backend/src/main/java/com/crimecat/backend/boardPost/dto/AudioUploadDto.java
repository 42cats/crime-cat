package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.entity.BoardPostAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 오디오 업로드 관련 DTO 클래스들
 */
public class AudioUploadDto {

    /**
     * 오디오 업로드 요청 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadRequest {
        private String audioTitle;
        @Builder.Default
        private BoardPostAttachment.AccessPolicy accessPolicy = BoardPostAttachment.AccessPolicy.PUBLIC;
    }

    /**
     * 임시 오디오 업로드 응답 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TempUploadResponse {
        private String tempId;
        private String originalFilename;
        private String audioTitle;
        private Long fileSize;
        private Long durationSeconds;
        private BoardPostAttachment.AccessPolicy accessPolicy;
        private String uploadedAt;
        private String expiresAt;
    }

    /**
     * 첨부파일 정보 응답 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentResponse {
        private String id;
        private String originalFilename;
        private String audioTitle;
        private Long fileSize;
        private Long durationSeconds;
        private BoardPostAttachment.AccessPolicy accessPolicy;
        private Integer sortOrder;
        private String streamingUrl;
        private String createdAt;
    }

    /**
     * 오디오 스트리밍 정보 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StreamingInfo {
        private String streamingUrl;
        private String contentType;
        private Long fileSize;
        private Long durationSeconds;
        private boolean requiresAuth;
    }

    /**
     * 오디오 메타데이터 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AudioMetadata {
        private String audioTitle;
        private Long durationSeconds;
        private String contentType;
        private Long fileSize;
    }
}