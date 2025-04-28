package com.crimecat.backend.web.gametheme.domain;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.crimecat.backend.web.gametheme.dto.AddCrimesceneThemeRequest;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "CRIMESCENE_THEMES")
@NoArgsConstructor
@Getter
@SuperBuilder
@AllArgsConstructor
@DiscriminatorValue(value = ThemeType.Numbers.CRIMESCENE)
public class CrimesceneTheme extends GameTheme {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MAKER_TEAMS_ID", updatable = false, insertable = false)
    private MakerTeam team;

    @Setter
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "MAKER_TEAMS_ID")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private UUID teamId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", updatable = false, insertable = false)
    private Guild guild;

    @Setter
    @Column(name = "GUILD_SNOWFLAKE")
    private String guildSnowflake;

    @Setter
    @Type(JsonType.class)
    @Column(name = "EXTRA", columnDefinition = "JSON")
    private Map<String, Object> extra;

    public static CrimesceneTheme from(AddCrimesceneThemeRequest request) {
    return CrimesceneTheme.builder()
        .title(request.getTitle())
        .summary(request.getSummary())
        .authorId(request.getAuthor())
        .tags(request.getTags())
        .content(request.getContent())
        .playerMin(request.getPlayerMin())
        .playerMax(request.getPlayerMax())
        .playTimeMin(request.getPlaytimeMin())
        .playTimeMax(request.getPlaytimeMax())
        .price(request.getPrice())
        .difficulty(request.getDifficulty())
        .publicStatus(request.isPublicStatus())
        .teamId(request.getMakerTeamsId())
        .guildSnowflake(request.getGuildSnowflake())
        .extra(request.getExtra())
        .build();
    }
}
