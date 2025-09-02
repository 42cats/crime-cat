package com.crimecat.backend.api.naver.dto;

/**
 * 좌표 정보 DTO
 * WGS84 좌표계 (위도, 경도)
 */
public class CoordinateInfo {
    private Double lat;  // 위도
    private Double lng;  // 경도
    
    public CoordinateInfo() {}
    
    public CoordinateInfo(Double lat, Double lng) {
        this.lat = lat;
        this.lng = lng;
    }
    
    public Double getLat() {
        return lat;
    }
    
    public Double getLng() {
        return lng;
    }
    
    public static CoordinateInfo of(Double lat, Double lng) {
        return new CoordinateInfo(lat, lng);
    }
}