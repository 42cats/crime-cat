package com.crimecat.backend.web.command.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "commands")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
public class Command {

  @Id
  @UuidGenerator
  @Column(name = "id", columnDefinition = "BINARY(16)", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "name", nullable = false, unique = true)
  private String name;

  @Column(name = "description", columnDefinition = "TEXT", nullable = false)
  private String description;

  @Column(name = "usage", length = 255, nullable = false)
  private String usage;

  @Column(name = "category", length = 100, nullable = false)
  private String category;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "required_permissions", columnDefinition = "JSON", nullable = false)
  private List<String> requiredPermissions;

  @Column(name = "content", columnDefinition = "TEXT", nullable = false)
  private String content;

  @CreatedDate
  @Column(name = "created_at", updatable = false, nullable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
