package com.crimecat.backend.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 방탈출 히스토리 통계 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscapeRoomHistoryStatsResponse {

    // 기본 통계
    private Long totalRecords;              // 총 기록 수
    private Long publicRecords;             // 공개 기록 수
    private Long successCount;              // 성공 횟수
    private Long failCount;                 // 실패 횟수
    private Double successRate;             // 성공률 (%)

    // 평균 값들
    private Double averageEscapeTime;       // 평균 탈출 시간 (분)
    private String formattedAverageEscapeTime; // 포맷된 평균 탈출 시간
    private Double averageFeltDifficulty;   // 평균 체감 난이도
    private Double averageSatisfaction;     // 평균 만족도
    private Double averageParticipants;     // 평균 참여 인원
    private Double averageHintUsed;         // 평균 힌트 사용 횟수

    // 별점 형태로 변환된 값들
    private Double averageFeltDifficultyStars;  // 평균 체감 난이도 (별점)
    private Double averageSatisfactionStars;    // 평균 만족도 (별점)

    // 최고/최저 기록
    private Integer fastestEscapeTime;      // 최단 탈출 시간
    private String formattedFastestTime;    // 포맷된 최단 시간
    private Integer slowestEscapeTime;      // 최장 탈출 시간
    private String formattedSlowestTime;    // 포맷된 최장 시간

    /**
     * 통계 데이터 빌더
     */
    public static EscapeRoomHistoryStatsResponse of(
            Long totalRecords,
            Long publicRecords,
            Long successCount,
            Double averageEscapeTime,
            Double averageFeltDifficulty,
            Double averageSatisfaction,
            Double averageParticipants,
            Double averageHintUsed,
            Integer fastestEscapeTime,
            Integer slowestEscapeTime
    ) {
        Long failCount = totalRecords - successCount;
        Double successRate = totalRecords > 0 ? (successCount.doubleValue() / totalRecords) * 100 : 0.0;

        return EscapeRoomHistoryStatsResponse.builder()
                .totalRecords(totalRecords)
                .publicRecords(publicRecords)
                .successCount(successCount)
                .failCount(failCount)
                .successRate(Math.round(successRate * 100.0) / 100.0) // 소수점 2자리
                .averageEscapeTime(averageEscapeTime)
                .formattedAverageEscapeTime(formatTime(averageEscapeTime))
                .averageFeltDifficulty(averageFeltDifficulty)
                .averageSatisfaction(averageSatisfaction)
                .averageParticipants(averageParticipants)
                .averageHintUsed(averageHintUsed)
                .averageFeltDifficultyStars(averageFeltDifficulty != null ? averageFeltDifficulty / 2.0 : null)
                .averageSatisfactionStars(averageSatisfaction != null ? averageSatisfaction / 2.0 : null)
                .fastestEscapeTime(fastestEscapeTime)
                .formattedFastestTime(formatTime(fastestEscapeTime))
                .slowestEscapeTime(slowestEscapeTime)
                .formattedSlowestTime(formatTime(slowestEscapeTime))
                .build();
    }

    /**
     * 시간을 시:분 형태로 포맷
     */
    private static String formatTime(Number timeMinutes) {
        if (timeMinutes == null) {
            return null;
        }
        
        int totalMinutes = timeMinutes.intValue();
        int hours = totalMinutes / 60;
        int minutes = totalMinutes % 60;
        
        if (hours > 0) {
            return String.format("%d시간 %d분", hours, minutes);
        } else {
            return String.format("%d분", minutes);
        }
    }
}