package com.crimecat.backend.gameHistory.domain;

import com.crimecat.backend.gameHistory.enums.SuccessStatus;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 방탈출 게임 히스토리 엔티티
 */
@Entity
@Table(name = "ESCAPE_ROOM_HISTORYS")
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
     * 방탈출 지점 ID (선택)
     */
    @Column(name = "ESCAPE_ROOM_LOCATION_ID")
    private UUID escapeRoomLocationId;

    /**
     * 기록 작성자 (필수)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WEB_USER_ID", nullable = false)
    private WebUser webUser;

    /**
     * 팀 인원수 (필수)
     */
    @Setter
    @Column(name = "TEAM_SIZE", nullable = false)
    private Integer teamSize;

    /**
     * 성공 여부 (필수)
     */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "SUCCESS_STATUS", nullable = false)
    private SuccessStatus successStatus;

    /**
     * 클리어 시간 (분 단위, 선택)
     */
    @Setter
    @Column(name = "CLEAR_TIME")
    private Integer clearTime;

    /**
     * 힌트 사용 횟수 (선택)
     */
    @Setter
    @Column(name = "HINT_COUNT")
    @Builder.Default
    private Integer hintCount = 0;

    /**
     * 난이도 평점 (1-5, 선택)
     */
    @Setter
    @Column(name = "DIFFICULTY_RATING")
    private Integer difficultyRating;

    /**
     * 재미 평점 (1-5, 선택)
     */
    @Setter
    @Column(name = "FUN_RATING")
    private Integer funRating;

    /**
     * 스토리 평점 (1-5, 선택)
     */
    @Setter
    @Column(name = "STORY_RATING")
    private Integer storyRating;

    /**
     * 플레이 날짜 (사용자가 직접 입력, 필수)
     */
    @Setter
    @Column(name = "PLAY_DATE", nullable = false)
    private LocalDate playDate;

    /**
     * 플레이 후기 (선택)
     */
    @Setter
    @Column(name = "MEMO", columnDefinition = "TEXT")
    private String memo;

    /**
     * 스포일러 포함 여부
     */
    @Setter
    @Column(name = "IS_SPOILER", nullable = false)
    @Builder.Default
    private Boolean isSpoiler = false;

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
     * 삭제 시간 (소프트 삭제)
     */
    @Setter
    @Column(name = "DELETED_AT")
    private LocalDateTime deletedAt;

    // === 비즈니스 메서드 ===

    /**
     * 기록 수정 시 업데이트 시간 갱신
     */
    public void updateRecord() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 소프트 삭제 처리
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        updateRecord();
    }

    /**
     * 스포일러 상태 토글
     */
    public void toggleSpoilerStatus() {
        this.isSpoiler = !this.isSpoiler;
        updateRecord();
    }

    /**
     * 작성자 여부 확인
     */
    public boolean isAuthor(UUID userId) {
        return this.webUser.getId().equals(userId);
    }

    /**
     * 탈출 시간을 시:분 형태로 반환
     */
    public String getFormattedClearTime() {
        if (clearTime == null) {
            return null;
        }
        int hours = clearTime / 60;
        int minutes = clearTime % 60;
        
        if (hours > 0) {
            return String.format("%d시간 %d분", hours, minutes);
        } else {
            return String.format("%d분", minutes);
        }
    }

    /**
     * 난이도 평점을 별점으로 변환 (1-5)
     */
    public Double getDifficultyRatingStars() {
        return difficultyRating != null ? difficultyRating.doubleValue() : null;
    }

    /**
     * 재미 평점을 별점으로 변환 (1-5)
     */
    public Double getFunRatingStars() {
        return funRating != null ? funRating.doubleValue() : null;
    }

    /**
     * 스토리 평점을 별점으로 변환 (1-5)
     */
    public Double getStoryRatingStars() {
        return storyRating != null ? storyRating.doubleValue() : null;
    }

    /**
     * 기록 표시 가능 여부 확인
     * 삭제된 기록은 표시하지 않음
     * 스포일러는 해당 테마 플레이 경험이 있는 사용자만
     */
    public boolean isVisible(UUID userId, boolean hasGameHistoryForTheme) {
        // 삭제된 기록은 볼 수 없음
        if (deletedAt != null) {
            return false;
        }
        
        // 스포일러 기록은 해당 테마 플레이 경험이 있는 사용자만 볼 수 있음
        if (isSpoiler && !isAuthor(userId) && !hasGameHistoryForTheme) {
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
        if (isSpoiler && !hasGameHistoryForTheme) {
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
        
        if (isSpoiler) {
            return "🔒 스포일러가 포함된 메모입니다. 이 테마를 플레이한 후 확인하세요.";
        }
        
        return null;
    }
    
    /**
     * 평균 평점 계산 (재미, 스토리 평점의 평균)
     * 이전 satisfaction 필드와의 호환성 유지
     */
    public Integer getAverageRating() {
        if (funRating == null && storyRating == null) {
            return null;
        }
        
        int sum = 0;
        int count = 0;
        
        if (funRating != null) {
            sum += funRating;
            count++;
        }
        
        if (storyRating != null) {
            sum += storyRating;
            count++;
        }
        
        return count > 0 ? sum / count : null;
    }
    
    /**
     * 평균 평점을 별점으로 변환
     * 이전 satisfactionStars와의 호환성 유지
     */
    public Double getAverageRatingStars() {
        Integer avgRating = getAverageRating();
        return avgRating != null ? avgRating.doubleValue() : null;
    }
    
    /**
     * Boolean 값 반환 (이전 isSuccess와 호환)
     */
    public Boolean isSuccessBoolean() {
        return successStatus == SuccessStatus.SUCCESS;
    }
}