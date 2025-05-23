package com.crimecat.backend.gameHistory.domain;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 방탈출 게임 히스토리 엔티티
 */
@Entity
@Table(name = "ESCAPE_ROOM_HISTORIES")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Getter
@EntityListeners(AuditingEntityListener.class)
public class EscapeRoomHistory {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    /**
     * 방탈출 테마 (필수)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ESCAPE_ROOM_THEME_ID", nullable = false)
    private EscapeRoomTheme escapeRoomTheme;

    /**
     * 기록 작성자 (필수)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User user;

    /**
     * 탈출 성공 여부 (필수)
     */
    @Setter
    @Column(name = "IS_SUCCESS", nullable = false)
    private Boolean isSuccess;

    /**
     * 탈출 시간 (분 단위, 실패시에도 기록 가능)
     */
    @Setter
    @Column(name = "ESCAPE_TIME_MINUTES")
    private Integer escapeTimeMinutes;

    /**
     * 체감 난이도 (1-10, 별 5개 표시용)
     */
    @Setter
    @Column(name = "FELT_DIFFICULTY", nullable = false)
    private Integer feltDifficulty;

    /**
     * 참여 인원 수 (필수)
     */
    @Setter
    @Column(name = "PARTICIPANTS_COUNT", nullable = false)
    private Integer participantsCount;

    /**
     * 힌트 사용 횟수
     */
    @Setter
    @Column(name = "HINT_USED_COUNT")
    @Builder.Default
    private Integer hintUsedCount = 0;

    /**
     * 만족도 (1-10, 별 5개 표시용, 필수)
     */
    @Setter
    @Column(name = "SATISFACTION", nullable = false)
    private Integer satisfaction;

    /**
     * 메모/후기 (1000자 제한)
     */
    @Setter
    @Column(name = "MEMO", length = 1000)
    private String memo;

    /**
     * 기록 공개 여부 (기본값: 공개)
     */
    @Setter
    @Column(name = "IS_PUBLIC", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    /**
     * 플레이 날짜 (사용자가 직접 입력, 필수)
     */
    @Setter
    @Column(name = "PLAY_DATE", nullable = false)
    private LocalDateTime playDate;

    /**
     * 기록 생성 시간 (자동)
     */
    @CreatedDate
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 기록 수정 시간
     */
    @Setter
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    /**
     * 스포일러 포함 여부 (댓글 열람 권한 체크용)
     */
    @Setter
    @Column(name = "HAS_SPOILER")
    @Builder.Default
    private Boolean hasSpoiler = false;

    /**
     * 매장 위치 (어느 지점에서 플레이했는지)
     */
    @Setter
    @Column(name = "STORE_LOCATION")
    private String storeLocation;

    // === 비즈니스 메서드 ===

    /**
     * 기록 수정 시 업데이트 시간 갱신
     */
    public void updateRecord() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 공개/비공개 상태 토글
     */
    public void togglePublicStatus() {
        this.isPublic = !this.isPublic;
        updateRecord();
    }

    /**
     * 스포일러 상태 토글
     */
    public void toggleSpoilerStatus() {
        this.hasSpoiler = !this.hasSpoiler;
        updateRecord();
    }

    /**
     * 작성자 여부 확인
     */
    public boolean isAuthor(UUID userId) {
        return this.user.getId().equals(userId);
    }

    /**
     * 탈출 시간을 시:분 형태로 반환
     */
    public String getFormattedEscapeTime() {
        if (escapeTimeMinutes == null) {
            return null;
        }
        int hours = escapeTimeMinutes / 60;
        int minutes = escapeTimeMinutes % 60;
        
        if (hours > 0) {
            return String.format("%d시간 %d분", hours, minutes);
        } else {
            return String.format("%d분", minutes);
        }
    }

    /**
     * 체감 난이도를 별점으로 변환 (1-10 → 0.5-5.0)
     */
    public Double getFeltDifficultyStars() {
        return feltDifficulty != null ? feltDifficulty / 2.0 : null;
    }

    /**
     * 만족도를 별점으로 변환 (1-10 → 0.5-5.0)
     */
    public Double getSatisfactionStars() {
        return satisfaction != null ? satisfaction / 2.0 : null;
    }

    /**
     * 게임 기록 표시 가능 여부 확인
     * 비공개이면 작성자만, 스포일러이면 해당 테마 플레이 경험이 있는 사용자만
     */
    public boolean isVisible(UUID userId, boolean hasGameHistoryForTheme) {
        // 비공개 기록은 작성자만 볼 수 있음
        if (!isPublic && !isAuthor(userId)) {
            return false;
        }
        
        // 스포일러 기록은 해당 테마 플레이 경험이 있는 사용자만 볼 수 있음
        if (hasSpoiler && !isAuthor(userId) && !hasGameHistoryForTheme) {
            return false;
        }
        
        return true;
    }

    /**
     * 메모 내용 표시 가능 여부 확인
     * 스포일러 메모는 해당 테마 플레이 경험이 있는 사용자만
     */
    public boolean canViewMemo(UUID userId, boolean hasGameHistoryForTheme) {
        if (memo == null || memo.trim().isEmpty()) {
            return false;
        }
        
        // 작성자는 항상 볼 수 있음
        if (isAuthor(userId)) {
            return true;
        }
        
        // 스포일러 메모는 해당 테마 플레이 경험이 있는 사용자만
        if (hasSpoiler && !hasGameHistoryForTheme) {
            return false;
        }
        
        return true;
    }

    /**
     * 스포일러가 포함된 정보를 마스킹하여 반환
     */
    public String getSafeMemo(UUID userId, boolean hasGameHistoryForTheme) {
        if (canViewMemo(userId, hasGameHistoryForTheme)) {
            return memo;
        }
        
        if (hasSpoiler) {
            return "🔒 스포일러가 포함된 메모입니다. 이 테마를 플레이한 후 확인하세요.";
        }
        
        return null;
    }
}