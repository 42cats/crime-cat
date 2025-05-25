package com.crimecat.backend.permission.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionWithStatusDto {
    private String permissionId;
    private String permissionName;
    private Integer price;
    private Integer duration;
    private String info;
    @JsonProperty("isOwned")
    private boolean isOwned;
    private String expiredDate; // 보유한 경우만 값 존재
    private boolean canExtend; // 연장 가능 여부
}
