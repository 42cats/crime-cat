package com.crimecat.backend.guild.dto.bot;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Discord 역할 정보 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoleDto {
    /**
     * Discord 역할 ID (Snowflake)
     */
    private String id;
    
    /**
     * 역할 이름
     */
    private String name;
    
    /**
     * 역할 색상 (16진수)
     */
    private Integer color;
    
    /**
     * 역할 위치 (높을수록 상위)
     */
    private Integer position;
    
    /**
     * 멘션 가능 여부
     */
    private Boolean mentionable;
    
    /**
     * 관리 권한 보유 여부
     */
    private Boolean managed;
}