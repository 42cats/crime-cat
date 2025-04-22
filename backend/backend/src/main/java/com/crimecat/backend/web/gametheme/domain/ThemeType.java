package com.crimecat.backend.web.gametheme.domain;

public enum ThemeType {
    CRIMESCENE(Values.CRIMESCENE),
//    ESCAPE_ROOM,
//    MURDER_MYSTERY,
//    REALWORLD
    ;


    ThemeType(String value) {
        if (!this.name().equals(value))
            throw new IllegalArgumentException("Incorrect use of ThemeType");
    }


    public static class Values {
        public static final String CRIMESCENE = "CRIMESCENE";
    }
}
