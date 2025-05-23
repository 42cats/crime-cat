package com.crimecat.backend.gametheme.domain;

import com.crimecat.backend.gametheme.dto.AddEscapeRoomThemeRequest;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Type;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 방탈출 테마 엔티티
 */
@Entity
@Table(name = "ESCAPE_ROOM_THEMES")
@NoArgsConstructor
@Getter
@SuperBuilder
@AllArgsConstructor
@DiscriminatorValue(value = ThemeType.Numbers.ESCAPE_ROOM)
public class EscapeRoomTheme extends GameTheme {

    /**
     * 장르 태그들 (정규화된 관계, 검색 성능 최적화)
     */
    @OneToMany(mappedBy = "escapeRoomTheme", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.Set<EscapeRoomGenreTag> genreTags = new java.util.HashSet<>();

    /**
     * 공포도 (1-10, 별 5개 표시용)
     * 1=0.5별, 2=1별, ..., 10=5별
     */
    @Setter
    @Column(name = "HORROR_LEVEL")
    private Integer horrorLevel;

    /**
     * 장치비중 (1-10, 별 5개 표시용)
     */
    @Setter
    @Column(name = "DEVICE_RATIO")
    private Integer deviceRatio;

    /**
     * 활동도 (1-10, 별 5개 표시용)
     */
    @Setter
    @Column(name = "ACTIVITY_LEVEL")
    private Integer activityLevel;

    /**
     * 오픈날짜
     */
    @Setter
    @Column(name = "OPEN_DATE")
    private LocalDate openDate;

    /**
     * 현재 운용여부
     */
    @Setter
    @Column(name = "IS_OPERATING", nullable = false)
    @Builder.Default
    private Boolean isOperating = true;

    /**
     * 매장 위치 정보들 (정규화된 관계, 검색 성능 최적화)
     * 하나 이상의 매장이 반드시 등록되어야 함
     */
    @OneToMany(mappedBy = "escapeRoomTheme", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.Set<EscapeRoomLocation> locations = new java.util.HashSet<>();

    /**
     * 추가 정보 (확장용 JSON 필드)
     */
    @Setter
    @Type(JsonType.class)
    @Column(name = "EXTRA", columnDefinition = "JSON")
    private java.util.Map<String, Object> extra;

    /**
     * AddEscapeRoomThemeRequest로부터 EscapeRoomTheme 생성
     */
    public static EscapeRoomTheme from(AddEscapeRoomThemeRequest request) {
        // extra 필드 초기화 및 URL 정보 추가
        java.util.Map<String, Object> extraData = new java.util.HashMap<>();
        if (request.getExtra() != null) {
            extraData.putAll(request.getExtra());
        }
        
        // URL 정보를 extra에 저장
        if (request.getHomepageUrl() != null && !request.getHomepageUrl().trim().isEmpty()) {
            extraData.put("homepageUrl", request.getHomepageUrl().trim());
        }
        if (request.getReservationUrl() != null && !request.getReservationUrl().trim().isEmpty()) {
            extraData.put("reservationUrl", request.getReservationUrl().trim());
        }

        EscapeRoomTheme theme = EscapeRoomTheme.builder()
                .title(request.getTitle())
                .summary(request.getSummary())
                .tags(request.getTags())
                .content(request.getContent())
                .playerMin(request.getPlayerMin())
                .playerMax(request.getPlayerMax())
                .playTimeMin(request.getPlaytimeMin())
                .playTimeMax(request.getPlaytimeMax())
                .price(request.getPrice())
                .difficulty(request.getDifficulty())
                .publicStatus(request.isPublicStatus())
                .updatedAt(LocalDateTime.now())
                .recommendationEnabled(request.isRecommendationEnabled())
                .commentEnabled(request.isCommentEnabled())
                // 방탈출 전용 필드
                .horrorLevel(request.getHorrorLevel())
                .deviceRatio(request.getDeviceRatio())
                .activityLevel(request.getActivityLevel())
                .openDate(request.getOpenDate())
                .isOperating(request.getIsOperating())
                .extra(extraData)
                .build();
        
        // 장르 태그 설정
        if (request.getGenreTags() != null) {
            theme.setGenreTagsFromStrings(request.getGenreTags());
        }
        
        // 매장 위치 설정
        if (request.getLocations() != null) {
            theme.setLocationsFromDtos(request.getLocations());
        }
        
        return theme;
    }

    /**
     * 운영 상태 변경
     */
    public void updateOperatingStatus(Boolean isOperating) {
        if (isOperating != null) {
            this.isOperating = isOperating;
            this.update();
        }
    }

    /**
     * 장르 태그 문자열 목록으로 설정
     */
    public void setGenreTagsFromStrings(java.util.Set<String> tagNames) {
        this.genreTags.clear();
        if (tagNames != null) {
            for (String tagName : tagNames) {
                this.genreTags.add(EscapeRoomGenreTag.of(this, tagName));
            }
        }
    }

    /**
     * 매장 위치 DTO 목록으로 설정
     */
    public void setLocationsFromDtos(java.util.List<com.crimecat.backend.gametheme.dto.EscapeRoomLocation> locationDtos) {
        this.locations.clear();
        if (locationDtos != null) {
            for (com.crimecat.backend.gametheme.dto.EscapeRoomLocation dto : locationDtos) {
                EscapeRoomLocation location = 
                    EscapeRoomLocation.builder()
                        .escapeRoomTheme(this)
                        .storeName(dto.getStoreName())
                        .address(dto.getAddress())
                        .roadAddress(dto.getRoadAddress())
                        .latitude(dto.getLat())
                        .longitude(dto.getLng())
                        .naverLink(dto.getLink())
                        .phone(dto.getPhone())
                        .description(dto.getDescription())
                        .build();
                this.locations.add(location);
            }
        }
    }

    /**
     * 장르 태그명 목록 반환 (DTO 변환용)
     */
    public java.util.Set<String> getGenreTagNames() {
        return genreTags.stream()
                .map(EscapeRoomGenreTag::getTagName)
                .collect(java.util.stream.Collectors.toSet());
    }

    /**
     * 매장 위치 DTO 목록 반환 (DTO 변환용)
     */
    public java.util.List<com.crimecat.backend.gametheme.dto.EscapeRoomLocation> getLocationDtos() {
        return locations.stream()
                .map(loc -> com.crimecat.backend.gametheme.dto.EscapeRoomLocation.builder()
                    .storeName(loc.getStoreName())
                    .address(loc.getAddress())
                    .roadAddress(loc.getRoadAddress())
                    .lat(loc.getLatitude())
                    .lng(loc.getLongitude())
                    .link(loc.getNaverLink())
                    .phone(loc.getPhone())
                    .description(loc.getDescription())
                    .build())
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * 매장 정보 업데이트
     */
    public void updateLocations(java.util.List<com.crimecat.backend.gametheme.dto.EscapeRoomLocation> locationDtos) {
        if (locationDtos != null && !locationDtos.isEmpty()) {
            setLocationsFromDtos(locationDtos);
            this.update();
        }
    }

    /**
     * 장르 태그 업데이트
     */
    public void updateGenreTags(java.util.Set<String> tagNames) {
        if (tagNames != null) {
            setGenreTagsFromStrings(tagNames);
            this.update();
        }
    }

    /**
     * 홈페이지 URL 반환
     */
    public String getHomepageUrl() {
        return extra != null ? (String) extra.get("homepageUrl") : null;
    }

    /**
     * 예약 페이지 URL 반환
     */
    public String getReservationUrl() {
        return extra != null ? (String) extra.get("reservationUrl") : null;
    }

    /**
     * URL 정보 업데이트
     */
    public void updateUrls(String homepageUrl, String reservationUrl) {
        if (this.extra == null) {
            this.extra = new java.util.HashMap<>();
        }
        
        if (homepageUrl != null && !homepageUrl.trim().isEmpty()) {
            this.extra.put("homepageUrl", homepageUrl.trim());
        } else {
            this.extra.remove("homepageUrl");
        }
        
        if (reservationUrl != null && !reservationUrl.trim().isEmpty()) {
            this.extra.put("reservationUrl", reservationUrl.trim());
        } else {
            this.extra.remove("reservationUrl");
        }
        
        this.update();
    }
}