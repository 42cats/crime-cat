package com.crimecat.backend.command.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandEditRequestDto {
  private String name;
  private String description;
  private String usageExample;
  private String category;
  private List<String> requiredPermissions;
  private String content;
}
