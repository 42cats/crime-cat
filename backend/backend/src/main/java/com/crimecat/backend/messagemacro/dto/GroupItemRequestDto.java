package com.crimecat.backend.messagemacro.dto;

import com.crimecat.backend.messagemacro.domain.GroupItem;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 그룹 아이템 생성 및 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupItemRequestDto {
    /**
     * 상위 그룹의 ID
     */
    @NotNull
    private UUID groupId;

    /**
     * 아이템 타입 (BUTTON or CONTENT)
     */
    @NotNull
    private GroupItem.Type type;

    /**
     * 부모 아이템 ID (없으면 null)
     */
    private UUID parentId;

    /**
     * 아이템 이름
     */
    private String name;

    /**
     * 아이템 내용 텍스트
     */
    private String text;

    /**
     * Discord 채널 ID
     */
    private String channelId;

    /**
     * Discord 역할 ID
     */
    private String roleId;

    /**
     * 이모지 (Unicode 또는 Discord 커스텀 이모지)
     */
    private String emoji;

    /**
     * 아이템 정렬 인덱스
     */
    @Min(0)
    private int index;
}

