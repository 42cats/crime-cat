package com.crimecat.backend.guild.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "CHARACTER_ROLES")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class CharacterRole {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JoinColumn(name = "CHARACTER", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Character character;

    @Column(name = "ROLE_SNOWFLAKE", nullable = false)
    private String roleSnowflake;
}
