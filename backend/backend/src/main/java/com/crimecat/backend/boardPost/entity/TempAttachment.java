package com.crimecat.backend.boardPost.entity;

import com.crimecat.backend.storage.StorageFileType;
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
import org.hibernate.type.SqlTypes;

/**
 * 임시 첨부파일 엔티티
 * - 게시글 작성 중 임시로 업로드된 파일 관리
 * - 만료 시간 기반 자동 정리
 */
@Entity
@Table(name = "temp_attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TempAttachment {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "temp_id", unique = true, nullable = false)
    private String tempId;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private WebUser user;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", nullable = false)
    private UserRole userRole;

    // 오디오 메타데이터
    @Column(name = "audio_title")
    private String audioTitle;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_policy", nullable = false)
    private BoardPostAttachment.AccessPolicy accessPolicy = BoardPostAttachment.AccessPolicy.PUBLIC;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 정적 팩토리 메서드
     */
    public static TempAttachment createTempAttachment(
        String tempId,
        String originalFilename,
        String storedFilename,
        String contentType,
        Long fileSize,
        WebUser user,
        String audioTitle,
        Long durationSeconds,
        BoardPostAttachment.AccessPolicy accessPolicy,
        LocalDateTime expiresAt
    ) {
        TempAttachment temp = new TempAttachment();
        temp.tempId = tempId;
        temp.originalFilename = originalFilename;
        temp.storedFilename = storedFilename;
        temp.contentType = contentType;
        temp.fileSize = fileSize;
        temp.user = user;
        temp.userRole = user.getRole();
        temp.audioTitle = audioTitle;
        temp.durationSeconds = durationSeconds;
        temp.accessPolicy = accessPolicy;
        temp.expiresAt = expiresAt;
        return temp;
    }

    /**
     * 만료 여부 확인
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * 파일 경로 생성
     */
    public String getFilePath() {
        // StorageFileType을 사용하여 일관된 경로 생성
        return StorageFileType.BOARD_POST_AUDIO.getUploadDir() + "/temp/" + storedFilename;
    }

    /**
     * BoardPostAttachment로 변환
     */
    public BoardPostAttachment toAttachment(BoardPost boardPost, Integer sortOrder) {
        return BoardPostAttachment.createAudioAttachment(
            boardPost,
            originalFilename,
            storedFilename,
            contentType,
            fileSize,
            sortOrder,
            audioTitle,
            durationSeconds,
            accessPolicy,
            userRole
        );
    }

    // Setter 메서드들 (필요한 것만)
    public void setAudioTitle(String audioTitle) {
        this.audioTitle = audioTitle;
    }

    public void setAccessPolicy(BoardPostAttachment.AccessPolicy accessPolicy) {
        this.accessPolicy = accessPolicy;
    }
}