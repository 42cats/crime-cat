package com.crimecat.backend.web.gametheme.domain;

import com.crimecat.backend.bot.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "MAKER_TEAM_MEMBERS")
@NoArgsConstructor
@Getter
@Builder
@AllArgsConstructor
public class MakerTeamMember {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TEAM_ID")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private MakerTeam team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", insertable = false, updatable = false)
    private User user;

    @Column(name = "USER_ID")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID userId;

    @Column(name = "NAME")
    private String name;
}
