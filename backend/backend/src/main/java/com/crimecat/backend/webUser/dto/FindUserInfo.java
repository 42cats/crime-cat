package com.crimecat.backend.webUser.dto;

import java.io.Serializable;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

/**
 * 사용자 검색 결과를 담는 DTO 클래스
 */
@Getter
@Builder
public class FindUserInfo implements Serializable {
    private static final long serialVersionUID = 1L;
    private List<UserSearchResponseDto> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;
    private String searchType;

    /**
     * Page 객체로부터 DTO 생성
     */
    public static FindUserInfo from(Page<UserSearchResponseDto> page, String searchType) {
        return FindUserInfo.builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .searchType(searchType)
                .build();
    }
}
