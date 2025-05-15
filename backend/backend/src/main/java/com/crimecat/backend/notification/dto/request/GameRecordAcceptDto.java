package com.crimecat.backend.notification.dto.request;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 게임 기록 요청 승인 시 사용할 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GameRecordAcceptDto {
    
    private Boolean isWin;          // 승리여부
    private LocalDateTime gameDate;    // 게임 실행 날짜
    private String characterName;  // 사용 캐릭터명
    private String ownerMemo; // 오너 메모
}
