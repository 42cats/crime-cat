package com.crimecat.backend.character.domain;

import com.crimecat.backend.guild.domain.Guild;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "CHARACTERS")
@NoArgsConstructor
@Getter
@EntityListeners(AuditingEntityListener.class)
public class Character {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    @Column(name = "NAME", nullable = false, updatable = false)
    private String name;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "character", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CharacterRole> characterRoles;

    public Character(String name, Guild guild) {
        this.name = name;
        this.guild = guild;
    }
}
