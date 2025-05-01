package com.crimecat.backend.command.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommandSummaryDto {
    private String id;
    private String name;
    private String description;
    private String usageExample;
    private String category;
    private Instant createdAt;
    private Instant updatedAt;
}
