package com.crimecat.backend.web.command.dto;

import java.util.List;
import lombok.Data;

@Data
public class CommandEditRequestDto {
  private String name;
  private String description;
  private String usage;
  private String category;
  private List<String> requiredPermissions;
  private String content;
}
