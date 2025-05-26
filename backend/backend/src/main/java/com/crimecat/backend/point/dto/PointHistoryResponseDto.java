package com.crimecat.backend.point.dto;

import com.crimecat.backend.point.domain.ItemType;
import com.crimecat.backend.point.domain.PointHistory;
import com.crimecat.backend.point.domain.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointHistoryResponseDto {

    private UUID id;
    private TransactionType type;
    private Integer amount;
    private Integer balanceAfter;
    private ItemType itemType;
    private String permissionName;
    private String relatedNickname;
    private String memo;
    private LocalDateTime usedAt;
    
    // 관리자용 추가 필드
    private String userNickname;
    private UUID userId;

    public static PointHistoryResponseDto from(PointHistory pointHistory) {
        return PointHistoryResponseDto.builder()
                .id(pointHistory.getId())
                .type(pointHistory.getType())
                .amount(pointHistory.getAmount())
                .balanceAfter(pointHistory.getBalanceAfter())
                .itemType(pointHistory.getItemType())
                .permissionName(pointHistory.getPermission() != null ? 
                    pointHistory.getPermission().getName() : null)
                .relatedNickname(pointHistory.getRelatedUserId() != null ? 
                    pointHistory.getRelatedUserId().getWebUser().getNickname() : null)
                .memo(pointHistory.getMemo())
                .usedAt(pointHistory.getUsedAt())
                .build();
    }
}
