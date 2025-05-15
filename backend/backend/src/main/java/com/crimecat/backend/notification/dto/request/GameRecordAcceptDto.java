package com.crimecat.backend.notification.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 게임 기록 요청 승인 시 사용할 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GameRecordAcceptDto {
    
    private String isWin;          // "WIN" or "LOSE"
    private LocalDate gameDate;    // 게임 실행 날짜
    private String characterName;  // 사용 캐릭터명
}
