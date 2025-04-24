package com.crimecat.backend.web.admin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Notice {
  
  @Id
  @UuidGenerator
  @JdbcTypeCode(SqlTypes.BINARY)
  private UUID id;

  @Column(name = "TITLE", nullable = false)
  private String title;

  @Column(name = "CONTENT", nullable = false)
  private String content;

  @Column(name = "SUMMARY", nullable = false)
  private String summary;

  @Enumerated(EnumType.STRING)
  @Column(name = "NOTICE_TYPE", nullable = false)
  private NoticeType noticeType = NoticeType.SYSTEM;

  @Column(name = "IS_PINNED", nullable = false)
  private Boolean isPinned = false;

  @CreatedDate
  private LocalDateTime createdAt;

  @LastModifiedDate
  private LocalDateTime updatedAt;

}
