package com.crimecat.backend.advertisement.domain;

public enum AdvertisementStatus {
    PENDING_QUEUE("대기열"),
    ACTIVE("활성"),
    CANCELLED("취소됨"),
    EXPIRED("만료됨"),
    REFUNDED("환불됨");
    
    private final String description;
    
    AdvertisementStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}