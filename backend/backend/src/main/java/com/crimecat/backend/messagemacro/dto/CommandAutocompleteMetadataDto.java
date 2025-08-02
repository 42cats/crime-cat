package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 봇 커맨드별 자동완성 메타데이터 DTO
 * Redis 캐시된 봇 커맨드 정보에서 자동완성 정보 추출
 */
@Data
@Builder
public class CommandAutocompleteMetadataDto {
    /**
     * 커맨드명 (예: "버튼", "기능버튼", "로그")
     */
    private String commandName;
    
    /**
     * 서브커맨드명 (예: "단일", "멀티")
     */
    private String subcommand;
    
    /**
     * 파라미터명 (예: "groupname", "자동화_그룹", "파일명")
     */
    private String parameterName;
    
    /**
     * 자동완성 API 엔드포인트 경로
     */
    private String apiEndpoint;
    
    /**
     * 멀티 선택 지원 여부 (groupnames vs groupname)
     */
    private boolean hasMultiSelect;
}