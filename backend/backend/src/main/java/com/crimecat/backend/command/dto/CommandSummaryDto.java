package com.crimecat.backend.command.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommandSummaryDto {
    private String id;
    private String name;
    private String description;
    private String usageExample;
    private String category;
    private Instant createdAt;
    private Instant updatedAt;
}
