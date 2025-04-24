package com.crimecat.backend.web.notice.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Notice {
  
  @Id
  @UuidGenerator
  @JdbcTypeCode(SqlTypes.BINARY)
  private UUID id;

  @Setter
  @Column(name = "TITLE", nullable = false)
  private String title;

  @Setter
  @Column(name = "CONTENT", nullable = false)
  private String content;

  @Setter
  @Column(name = "SUMMARY", nullable = false)
  private String summary;

  @Setter
  @Enumerated(EnumType.STRING)
  @Column(name = "NOTICE_TYPE", nullable = false)
  private NoticeType noticeType = NoticeType.SYSTEM;

  @Setter
  @Column(name = "IS_PINNED", nullable = false)
  private Boolean isPinned = false;

  @Setter
  @Column(name = "ORDER_IDX")
  private Integer orderIdx = 0;

  @CreatedDate
  private LocalDateTime createdAt;

  @LastModifiedDate
  private LocalDateTime updatedAt;

}
