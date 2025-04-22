package com.crimecat.backend.web.gametheme.domain;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Map;

@Entity
@Table(name = "CRIMESCENE_THEMES")
@NoArgsConstructor
@Getter
@AllArgsConstructor
@DiscriminatorValue(value = ThemeType.Values.CRIMESCENE)
public class CrimesceneTheme extends GameTheme {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MAKER_TEAMS_ID")
    private MakerTeam team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE")
    private Guild guild;

    @Type(JsonType.class)
    @Column(name = "EXTRA", columnDefinition = "JSON")
    private Map<String, Object> extra;
}
