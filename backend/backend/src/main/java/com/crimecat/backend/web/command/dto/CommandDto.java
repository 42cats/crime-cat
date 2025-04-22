package com.crimecat.backend.web.command.dto;

import java.time.Instant;
import java.util.List;
import lombok.Data;

@Data
public class CommandDto {
  private String name;
  private String description;
  private String usage;
  private String category;
  private List<String> requiredPermissions;
  private String content;
  private Instant createdAt;
  private Instant updatedAt;
}
