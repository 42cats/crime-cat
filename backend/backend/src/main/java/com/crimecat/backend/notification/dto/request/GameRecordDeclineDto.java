package com.crimecat.backend.notification.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 게임 기록 요청 거절 시 사용할 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GameRecordDeclineDto {
    
    private String declineMessage; // 거절 메시지
}
