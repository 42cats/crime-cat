package com.crimecat.backend.guild.domain;

import jakarta.persistence.*;

import java.util.UUID;
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
    private String headTitle;

    @Column(name = "ROLE_SNOWFLAKE")
    private String roleSnowflake;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    public void setHeadTitle(JsonNullable<String> headTitle) {
        headTitle.ifPresent(v -> this.headTitle = v);
    }

    public void setRoleSnowflake(JsonNullable<String> roleSnowflake) {
        roleSnowflake.ifPresent(v -> this.roleSnowflake = v);
    }
}
