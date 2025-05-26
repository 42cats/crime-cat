package com.crimecat.backend.command.dto;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommandDto {
  private String id;
  private String name;
  private String description;
  private String usageExample;
  private String category;
  private List<String> requiredPermissions;
  private String content;
  private Instant createdAt;
  private Instant updatedAt;
}
