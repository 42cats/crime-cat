package com.crimecat.backend.hashtag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HashTagDto {
    private UUID id;
    private String name;
    private int useCount;
    private LocalDateTime lastUsedAt;
}
