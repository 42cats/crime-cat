package com.crimecat.backend.gametheme.enums;

import java.util.Arrays;

public enum ThemeType {
    CRIMESCENE(Values.CRIMESCENE, Numbers.CRIMESCENE),
    ESCAPE_ROOM(Values.ESCAPE_ROOM, Numbers.ESCAPE_ROOM),
//    MURDER_MYSTERY,
//    REALWORLD
    ;


    ThemeType(String value, String number) {
        if (!this.name().equals(value) || this.ordinal() != Integer.parseInt(number))
            throw new IllegalArgumentException("Incorrect use of ThemeType");
    }

    public static boolean contains(String value) {
        return Arrays.stream(ThemeType.values()).anyMatch(v -> v.name().equals(value));
    }

    public static class Values {
        public static final String CRIMESCENE = "CRIMESCENE";
        public static final String ESCAPE_ROOM = "ESCAPE_ROOM";
    }

    public static class Numbers {
        public static final String CRIMESCENE = "0";
        public static final String ESCAPE_ROOM = "1";
    }
}
