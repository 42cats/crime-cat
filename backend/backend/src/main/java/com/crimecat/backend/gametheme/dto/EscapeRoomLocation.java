package com.crimecat.backend.gametheme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 방탈출 매장 위치 정보 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscapeRoomLocation {
    
    @JsonProperty("storeName")
    private String storeName;        // 매장명
    
    @JsonProperty("address")
    private String address;          // 주소
    
    @JsonProperty("roadAddress")
    private String roadAddress;      // 도로명주소
    
    @JsonProperty("lat")
    private Double lat;              // 위도
    
    @JsonProperty("lng")
    private Double lng;              // 경도
    
    @JsonProperty("link")
    private String link;             // 네이버 링크
    
    @JsonProperty("phone")
    private String phone;            // 전화번호 (선택사항)
    
    @JsonProperty("description")
    private String description;      // 매장 설명 (선택사항)
}