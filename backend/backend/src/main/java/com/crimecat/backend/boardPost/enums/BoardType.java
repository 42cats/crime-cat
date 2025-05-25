package com.crimecat.backend.boardPost.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BoardType {
    CHAT("자유게시판"),
    QUESTION("질문게시판"), 
    CREATOR("제작자게시판"),
    NONE("전체");
    
    private final String description;
}
