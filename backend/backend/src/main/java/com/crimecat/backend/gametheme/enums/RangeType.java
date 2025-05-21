package com.crimecat.backend.gametheme.enums;

import com.crimecat.backend.exception.ErrorStatus;

public enum RangeType {
    PLAYER("playerMin", "playerMax", true),
    PRICE("price", "price", false),
    PLAYTIME("playTimeMin", "playTimeMax", true),
    DIFFICULTY("difficulty", "difficulty", false),
    ;

    RangeType(String min, String max, boolean seperated) {
        this.min = min;
        this.max = max;
        this.seperated = seperated;
    }

    public final String min;
    public final String max;
    public final boolean seperated;
}
