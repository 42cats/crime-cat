package com.crimecat.backend.command.dto;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommandDto implements Serializable {
  private static final long serialVersionUID = 1L;
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
