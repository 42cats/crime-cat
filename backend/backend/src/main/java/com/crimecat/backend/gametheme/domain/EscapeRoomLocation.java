package com.crimecat.backend.gametheme.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * 방탈출 매장 위치 정보 엔티티
 * JSON 대신 정규화된 구조로 검색 성능 최적화
 */
@Entity
@Table(name = "ESCAPE_ROOM_LOCATIONS",
       indexes = {
           @Index(name = "idx_store_name", columnList = "store_name"),
           @Index(name = "idx_address", columnList = "address"),
           @Index(name = "idx_escape_room_theme_id", columnList = "escape_room_theme_id")
       })
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Getter
public class EscapeRoomLocation {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    /**
     * 방탈출 테마 참조
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ESCAPE_ROOM_THEME_ID", nullable = false)
    private EscapeRoomTheme escapeRoomTheme;

    /**
     * 매장명 (검색용 인덱스)
     */
    @Column(name = "STORE_NAME", nullable = false, length = 200)
    private String storeName;

    /**
     * 주소
     */
    @Column(name = "ADDRESS", nullable = false, length = 500)
    private String address;

    /**
     * 도로명주소
     */
    @Column(name = "ROAD_ADDRESS", length = 500)
    private String roadAddress;

    /**
     * 위도
     */
    @Column(name = "LATITUDE", nullable = false)
    private Double latitude;

    /**
     * 경도
     */
    @Column(name = "LONGITUDE", nullable = false)
    private Double longitude;

    /**
     * 네이버 링크
     */
    @Column(name = "NAVER_LINK", length = 1000)
    private String naverLink;

    /**
     * 전화번호
     */
    @Column(name = "PHONE", length = 50)
    private String phone;

    /**
     * 매장 설명
     */
    @Column(name = "DESCRIPTION", length = 1000)
    private String description;

    // 정적 팩토리 메서드
    public static EscapeRoomLocation of(EscapeRoomTheme theme, String storeName, String address, 
                                       String roadAddress, Double lat, Double lng, String link) {
        return EscapeRoomLocation.builder()
                .escapeRoomTheme(theme)
                .storeName(storeName)
                .address(address)
                .roadAddress(roadAddress)
                .latitude(lat)
                .longitude(lng)
                .naverLink(link)
                .build();
    }

    // DTO에서 생성하는 정적 팩토리 메서드
    public static EscapeRoomLocation fromDto(EscapeRoomTheme theme, 
                                           com.crimecat.backend.gametheme.dto.EscapeRoomLocation dto) {
        return EscapeRoomLocation.builder()
                .escapeRoomTheme(theme)
                .storeName(dto.getStoreName())
                .address(dto.getAddress())
                .roadAddress(dto.getRoadAddress())
                .latitude(dto.getLat())
                .longitude(dto.getLng())
                .naverLink(dto.getLink())
                .phone(dto.getPhone())
                .description(dto.getDescription())
                .build();
    }
}