package com.crimecat.backend.boardPost.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PostType {
    GENERAL("일반"),
    QUESTION("질문"),
    PHOTO("사진"),
    SECRET("비밀"),
    PROMOTION("홍보"),
    RECRUIT("모집"),
    CRIME_SCENE("크라임씬"),
    MURDER_MYSTERY("머더미스터리"),
    ESCAPE_ROOM("방탈출"),
    REAL_WORLD("리얼월드"),
    EVENT("이벤트"),
    NOTICE("공지");
    
    private final String description;
}
