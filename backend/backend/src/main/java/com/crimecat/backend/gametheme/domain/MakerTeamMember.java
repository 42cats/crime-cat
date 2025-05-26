package com.crimecat.backend.gametheme.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "maker_team_members")
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
    @JoinColumn(name = "WEB_USER_ID", insertable = false, updatable = false)
    private WebUser webUser;

    @Column(name = "WEB_USER_ID", columnDefinition = "BINARY(16)")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID webUserId;

    @Column(name = "NAME")
    @Setter
    private String name;

    @Column(name = "IS_LEADER")
    @Builder.Default
    @Setter
    private boolean isLeader = false;
}
