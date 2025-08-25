package com.crimecat.backend.schedule.service;

import com.crimecat.backend.schedule.repository.UserCalendarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 캘린더 색상 관리 컴포넌트
 * - 순서 기반 색상 인덱스 할당
 * - 8가지 기본 색상 순환 사용
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CalendarColorManager {

    private final UserCalendarRepository userCalendarRepository;

    /**
     * 기본 색상 배열 (Google Calendar 스타일)
     */
    private static final String[] DEFAULT_COLORS = {
        "#FFB800", // Yellow (기본)
        "#FF6B6B", // Red
        "#4ECDC4", // Teal
        "#45B7D1", // Blue
        "#96CEB4", // Green
        "#FFEAA7", // Light Yellow
        "#DDA0DD", // Plum
        "#98D8C8"  // Mint
    };

    private static final String[] COLOR_NAMES = {
        "Yellow", "Red", "Teal", "Blue", 
        "Green", "Light Yellow", "Plum", "Mint"
    };

    /**
     * 색상 인덱스로 HEX 색상 반환
     */
    public String getColorByIndex(int colorIndex) {
        if (colorIndex < 0 || colorIndex >= DEFAULT_COLORS.length) {
            log.warn("Invalid color index: {}. Using default color (0).", colorIndex);
            return DEFAULT_COLORS[0];
        }
        return DEFAULT_COLORS[colorIndex];
    }

    /**
     * 색상 인덱스로 색상 이름 반환
     */
    public String getColorNameByIndex(int colorIndex) {
        if (colorIndex < 0 || colorIndex >= COLOR_NAMES.length) {
            return COLOR_NAMES[0];
        }
        return COLOR_NAMES[colorIndex];
    }

    /**
     * 사용자의 다음 사용 가능한 색상 인덱스 반환
     */
    public int getNextAvailableColorIndex(UUID userId) {
        try {
            int userCalendarCount = userCalendarRepository.countByUserIdAndIsActive(userId, true);
            int nextColorIndex = userCalendarCount % DEFAULT_COLORS.length;
            
            log.debug("User {} has {} active calendars, assigning color index: {}", 
                userId, userCalendarCount, nextColorIndex);
            
            return nextColorIndex;
        } catch (Exception e) {
            log.error("Failed to get next color index for user: {}", userId, e);
            return 0; // 기본 색상 반환
        }
    }

    /**
     * 모든 사용 가능한 색상 정보 반환
     */
    public ColorInfo[] getAllColors() {
        ColorInfo[] colors = new ColorInfo[DEFAULT_COLORS.length];
        for (int i = 0; i < DEFAULT_COLORS.length; i++) {
            colors[i] = new ColorInfo(i, DEFAULT_COLORS[i], COLOR_NAMES[i]);
        }
        return colors;
    }

    /**
     * 색상 정보 DTO
     */
    public static class ColorInfo {
        private final int index;
        private final String hex;
        private final String name;

        public ColorInfo(int index, String hex, String name) {
            this.index = index;
            this.hex = hex;
            this.name = name;
        }

        public int getIndex() { return index; }
        public String getHex() { return hex; }
        public String getName() { return name; }
    }

    /**
     * 색상 인덱스 유효성 검증
     */
    public boolean isValidColorIndex(int colorIndex) {
        return colorIndex >= 0 && colorIndex < DEFAULT_COLORS.length;
    }

    /**
     * 총 사용 가능한 색상 개수 반환
     */
    public int getTotalColorCount() {
        return DEFAULT_COLORS.length;
    }
}