package com.crimecat.backend.comment.domain;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 방탈출 테마 댓글 엔티티
 * 일반 댓글과 게임 기록 기반 댓글을 구분
 */
@Entity
@Table(name = "ESCAPE_ROOM_COMMENTS",
       indexes = {
           @Index(name = "idx_escape_room_theme_id", columnList = "escape_room_theme_id"),
           @Index(name = "idx_escape_room_history_id", columnList = "escape_room_history_id"),
           @Index(name = "idx_user_id", columnList = "user_id"),
           @Index(name = "idx_created_at", columnList = "created_at")
       })
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Getter
@EntityListeners(AuditingEntityListener.class)
public class EscapeRoomComment {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    /**
     * 방탈출 테마 (필수)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ESCAPE_ROOM_THEME_ID", nullable = false)
    private EscapeRoomTheme escapeRoomTheme;

    /**
     * 댓글 작성자 (필수)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User user;

    /**
     * 게임 기록 (있으면 게임 기록 기반 댓글, 없으면 일반 댓글)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ESCAPE_ROOM_HISTORY_ID")
    private EscapeRoomHistory escapeRoomHistory;

    /**
     * 댓글 내용 (필수)
     */
    @Setter
    @Column(name = "CONTENT", nullable = false, length = 2000)
    private String content;

    /**
     * 스포일러 포함 여부
     * true인 경우 게임 기록이 있는 사용자만 볼 수 있음
     */
    @Setter
    @Column(name = "HAS_SPOILER", nullable = false)
    @Builder.Default
    private Boolean hasSpoiler = false;

    /**
     * 좋아요 수
     */
    @Column(name = "LIKES_COUNT", nullable = false)
    @Builder.Default
    private Integer likesCount = 0;

    // 비공개 댓글 기능 제거 - 스포일러 시스템만 지원

    /**
     * 댓글 삭제 여부 (soft delete)
     */
    @Setter
    @Column(name = "IS_DELETED", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * 댓글 생성 시간
     */
    @CreatedDate
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 댓글 수정 시간
     */
    @Setter
    @LastModifiedDate
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    // === 비즈니스 메서드 ===

    /**
     * 댓글 유형 확인 - 게임 기록 기반 댓글인지
     */
    public boolean isGameHistoryComment() {
        return escapeRoomHistory != null;
    }

    /**
     * 댓글 유형 확인 - 일반 댓글인지
     */
    public boolean isGeneralComment() {
        return escapeRoomHistory == null;
    }

    /**
     * 작성자 여부 확인
     */
    public boolean isAuthor(UUID userId) {
        return this.user.getId().equals(userId);
    }

    /**
     * 댓글 수정
     */
    public void updateContent(String content, Boolean hasSpoiler) {
        if (content != null && !content.trim().isEmpty()) {
            this.content = content.trim();
        }
        if (hasSpoiler != null) {
            this.hasSpoiler = hasSpoiler;
        }
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 댓글 삭제 (soft delete)
     */
    public void delete() {
        this.isDeleted = true;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 스포일러 상태 토글
     */
    public void toggleSpoilerStatus() {
        this.hasSpoiler = !this.hasSpoiler;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 스포일러 댓글 열람 권한 확인
     * 스포일러 댓글은 작성자도 포함하여 해당 테마의 게임 기록이 있는 사용자만 볼 수 있음
     */
    public boolean canViewSpoilerComment(UUID userId, boolean hasGameHistory) {
        if (!hasSpoiler) {
            return true; // 스포일러가 아니면 누구나 볼 수 있음
        }
        
        // 스포일러 댓글은 작성자여도 게임 기록이 있어야만 볼 수 있음
        return hasGameHistory;
    }

    /**
     * 댓글 표시 가능 여부 확인
     * 스포일러 댓글은 해당 테마의 게임 기록이 있는 사용자만 볼 수 있음
     */
    public boolean isVisible(UUID userId, boolean hasGameHistory) {
        if (isDeleted) {
            return false;
        }
        
        // 스포일러 댓글 권한 체크
        if (hasSpoiler && !isAuthor(userId) && !hasGameHistory) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 좋아요 수 증가
     */
    public void increaseLikesCount() {
        this.likesCount++;
    }
    
    /**
     * 좋아요 수 감소
     */
    public void decreaseLikesCount() {
        if (this.likesCount > 0) {
            this.likesCount--;
        }
    }
}