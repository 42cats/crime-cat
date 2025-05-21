package com.crimecat.backend.hashtag.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "hashtags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class HashTag {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
    
    @Column(name = "name", unique = true, nullable = false)
    private String name;
    
    @OneToMany(mappedBy = "hashTag", cascade = CascadeType.ALL)
    private List<PostHashTag> posts = new ArrayList<>();
    
    @Column(name = "use_count")
    @Builder.Default
    private int useCount = 0;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    public void incrementUseCount() {
        this.useCount++;
        this.lastUsedAt = LocalDateTime.now();
    }
    
    public void decrementUseCount() {
        if (this.useCount > 0) {
            this.useCount--;
        }
    }
    
    public static HashTag create(String name) {
        return HashTag.builder()
                .name(name.toLowerCase().trim())
                .lastUsedAt(LocalDateTime.now())
                .build();
    }
}
