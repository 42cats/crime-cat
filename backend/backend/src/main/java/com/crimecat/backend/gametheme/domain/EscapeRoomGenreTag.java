package com.crimecat.backend.gametheme.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * 방탈출 테마 - 장르 태그 연결 테이블
 * JSON 대신 정규화된 구조로 검색 성능 최적화
 */
@Entity
@Table(name = "ESCAPE_ROOM_GENRE_TAGS", 
       indexes = {
           @Index(name = "idx_genre_tag_name", columnList = "tag_name"),
           @Index(name = "idx_escape_room_theme_id", columnList = "escape_room_theme_id")
       })
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Getter
public class EscapeRoomGenreTag {

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
     * 장르 태그명 (검색 최적화를 위한 인덱스)
     */
    @Column(name = "TAG_NAME", nullable = false, length = 50)
    private String tagName;

    /**
     * 태그 생성/수정 시 자동으로 소문자 정규화
     */
    @PrePersist
    @PreUpdate
    private void normalizeTagName() {
        if (tagName != null) {
            tagName = tagName.trim().toLowerCase();
        }
    }

    // 정적 팩토리 메서드
    public static EscapeRoomGenreTag of(EscapeRoomTheme theme, String tagName) {
        return EscapeRoomGenreTag.builder()
                .escapeRoomTheme(theme)
                .tagName(tagName.trim().toLowerCase())
                .build();
    }
}