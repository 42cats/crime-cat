package com.crimecat.backend.messagemacro.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "button_automations")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ButtonAutomation {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "guild_id", nullable = false, length = 50)
    private String guildId;

    @Column(name = "group_id")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID groupId;

    @Column(name = "button_label", nullable = false, length = 100)
    private String buttonLabel;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "config", nullable = false, columnDefinition = "JSON")
    private String config;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

    // FK 관계 (optional, 성능을 위해 fetch 시에만 사용)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", insertable = false, updatable = false)
    private ButtonAutomationGroup group;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}