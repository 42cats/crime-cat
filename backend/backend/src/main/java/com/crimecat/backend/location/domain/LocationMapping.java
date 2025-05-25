package com.crimecat.backend.location.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "location_mappings", indexes = {
    @Index(name = "idx_location_keyword", columnList = "keyword"),
    @Index(name = "idx_location_normalized", columnList = "normalized")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class LocationMapping {
    
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String keyword;
    
    @Column(nullable = false, length = 200)
    private String normalized;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<String> relatedKeywords = new ArrayList<>();
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    @Builder.Default
    private List<String> typoVariants = new ArrayList<>();
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(length = 500)
    private String description;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // 검색을 위한 모든 키워드를 반환
    public List<String> getAllSearchKeywords() {
        List<String> allKeywords = new ArrayList<>();
        allKeywords.add(keyword);
        allKeywords.addAll(relatedKeywords);
        allKeywords.addAll(typoVariants);
        return allKeywords;
    }
}