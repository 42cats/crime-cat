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
@Table(name = "button_automation_groups")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ButtonAutomationGroup {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "guild_id", nullable = false, length = 50)
    private String guildId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "settings", columnDefinition = "JSON")
    private String settings;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}