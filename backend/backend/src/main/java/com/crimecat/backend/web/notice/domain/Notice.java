package com.crimecat.backend.web.notice.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
@Table(name = "notices")
public class Notice {
  
  @Id
  @UuidGenerator
  @JdbcTypeCode(SqlTypes.BINARY)
  private UUID id;

  @Setter
  @Column(name = "title", nullable = false)
  private String title;

  @Setter
  @Column(name = "content", nullable = false, columnDefinition = "TEXT")
  private String content;

  @Setter
  @Column(name = "summary", nullable = false, length = 300)
  private String summary;

  @Setter
  @Enumerated(EnumType.STRING)
  @Column(name = "notice_type", nullable = false)
  private NoticeType noticeType = NoticeType.SYSTEM;

  @Setter
  @Column(name = "is_pinned", nullable = false)
  private Boolean isPinned = false;

  @Setter
  @Column(name = "order_index")
  private Integer orderIdx = 0;

  @CreatedDate
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", updatable = false)
  private LocalDateTime updatedAt;

}
