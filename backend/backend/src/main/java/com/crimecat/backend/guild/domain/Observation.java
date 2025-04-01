package com.crimecat.backend.guild.domain;

import com.crimecat.backend.user.domain.User;
import jakarta.persistence.*;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;
import org.openapitools.jackson.nullable.JsonNullable;

@Entity
@Table(name = "OBSERVATIONS")
@NoArgsConstructor
@Getter
public class Observation {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "HEAD_TITLE", nullable = false)
    @NotNull
    private String headTitle;

    @Column(name = "ROLE_SNOWFLAKE")
    private String roleSnowflake;

    @Column(name = "GUILD_SNOWFLAKE", nullable = false)
    @NotNull
    private String guildSnowflake;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", insertable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    public Observation(String snowflake, String roleSnowflake, String headTitle) {
        this.guildSnowflake = snowflake;
        this.roleSnowflake = roleSnowflake;
        this.headTitle = headTitle;
    }

    public void setHeadTitle(JsonNullable<String> headTitle) {
        headTitle.ifPresent(v -> this.headTitle = v);
    }

    public void setRoleSnowflake(JsonNullable<String> roleSnowflake) {
        roleSnowflake.ifPresent(v -> this.roleSnowflake = v);
    }
}
