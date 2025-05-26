package com.crimecat.backend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 페이징 응답 DTO
 * Page 객체를 클라이언트에게 응답하기 위한 공통 포맷
 * @param <T> 페이징 데이터 타입
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PageResponseDto<T> {
    
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean empty;
    
    /**
     * Spring Data JPA Page 객체로부터 PageResponseDto 생성
     * @param page Spring Data JPA Page 객체
     */
    public PageResponseDto(Page<T> page) {
        this.content = page.getContent();
        this.pageNumber = page.getNumber();
        this.pageSize = page.getSize();
        this.totalElements = page.getTotalElements();
        this.totalPages = page.getTotalPages();
        this.first = page.isFirst();
        this.last = page.isLast();
        this.empty = page.isEmpty();
    }
    
    /**
     * 단순 리스트로부터 단일 페이지 생성 (totalElements = list.size)
     * @param content 데이터 리스트
     */
    public PageResponseDto(List<T> content) {
        this.content = content;
        this.pageNumber = 0;
        this.pageSize = content.size();
        this.totalElements = content.size();
        this.totalPages = 1;
        this.first = true;
        this.last = true;
        this.empty = content.isEmpty();
    }
}
