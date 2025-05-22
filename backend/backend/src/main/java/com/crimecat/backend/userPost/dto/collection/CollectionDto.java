package com.crimecat.backend.userPost.dto.collection;

import com.crimecat.backend.userPost.domain.collection.Collection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionDto {
    
    private UUID id;
    private String name;
    private String description;
    private Boolean isPrivate;
    private Long postCount;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static CollectionDto from(Collection collection) {
        return CollectionDto.builder()
                .id(collection.getId())
                .name(collection.getName())
                .description(collection.getDescription())
                .isPrivate(collection.getIsPrivate())
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
    
    public static CollectionDto from(Collection collection, Long postCount, String thumbnailUrl) {
        return CollectionDto.builder()
                .id(collection.getId())
                .name(collection.getName())
                .description(collection.getDescription())
                .isPrivate(collection.getIsPrivate())
                .postCount(postCount)
                .thumbnailUrl(thumbnailUrl)
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
}