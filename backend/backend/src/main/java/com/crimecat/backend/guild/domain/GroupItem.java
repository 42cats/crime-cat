package com.crimecat.backend.guild.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "group_items")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class GroupItem {

    public enum Type {
        BUTTON,
        CONTENT
    }

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "parent_id", columnDefinition = "BINARY(16)")
    private UUID parentId;

    @Column(length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(name = "channel_id", length = 36)
    private String channelId;

    @Column(name = "`index`", nullable = false)
    private int index;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;
}
