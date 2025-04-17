package com.crimecat.backend.messagemacro.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "groups", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"guild_snowflake", "name"})
})
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Group {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "guild_snowflake", nullable = false, length = 30)
    private String guildSnowflake;

    @Column(name = "`index`", nullable = false)
    private int index;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;
}