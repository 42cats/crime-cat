package com.crimecat.backend.boardPost.entity;

import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.boardPost.domain.BoardPost;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/**
 * 게시글 첨부파일 엔티티
 * - 오디오, 이미지, 문서 첨부파일 관리
 * - 역할 기반 접근 제어 지원
 */
@Entity
@Table(name = "board_post_attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardPostAttachment {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_post_id", nullable = false)
    private BoardPost boardPost;

    @Enumerated(EnumType.STRING)
    @Column(name = "attachment_type", nullable = false)
    private AttachmentType attachmentType;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    // 오디오 전용 메타데이터
    @Column(name = "audio_title")
    private String audioTitle;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @Column(name = "encryption_key")
    private String encryptionKey;

    // 접근 제어
    @Enumerated(EnumType.STRING)
    @Column(name = "access_policy", nullable = false)
    private AccessPolicy accessPolicy = AccessPolicy.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "created_by_role", nullable = false)
    private UserRole createdByRole = UserRole.USER;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 첨부파일 타입 열거형
     */
    public enum AttachmentType {
        AUDIO, IMAGE, DOCUMENT
    }

    /**
     * 접근 정책 열거형
     * - PRIVATE: 로그인 필요
     * - PUBLIC: 모든 사용자 접근 가능
     */
    public enum AccessPolicy {
        PRIVATE, PUBLIC
    }

    /**
     * 정적 팩토리 메서드
     */
    public static BoardPostAttachment createAudioAttachment(
        BoardPost boardPost,
        String originalFilename,
        String storedFilename,
        String contentType,
        Long fileSize,
        Integer sortOrder,
        String audioTitle,
        Long durationSeconds,
        AccessPolicy accessPolicy,
        UserRole createdByRole
    ) {
        BoardPostAttachment attachment = new BoardPostAttachment();
        attachment.boardPost = boardPost;
        attachment.attachmentType = AttachmentType.AUDIO;
        attachment.originalFilename = originalFilename;
        attachment.storedFilename = storedFilename;
        attachment.contentType = contentType;
        attachment.fileSize = fileSize;
        attachment.sortOrder = sortOrder;
        attachment.audioTitle = audioTitle;
        attachment.durationSeconds = durationSeconds;
        attachment.accessPolicy = accessPolicy;
        attachment.createdByRole = createdByRole;
        return attachment;
    }

    /**
     * 접근 권한 확인
     */
    public boolean isAccessible(WebUser user) {
        if (accessPolicy == AccessPolicy.PUBLIC) {
            return true;
        }
        // PRIVATE인 경우 로그인된 사용자만 접근 가능
        return user != null;
    }

    /**
     * 파일 경로 생성
     */
    public String getFilePath() {
        return "board-post-audio/" + storedFilename;
    }

    // Setter 메서드들 (필요한 것만)
    public void setAudioTitle(String audioTitle) {
        this.audioTitle = audioTitle;
    }

    public void setAccessPolicy(AccessPolicy accessPolicy) {
        this.accessPolicy = accessPolicy;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}