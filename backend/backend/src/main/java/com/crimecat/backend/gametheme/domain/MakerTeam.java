package com.crimecat.backend.gametheme.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "MAKER_TEAMS")
@NoArgsConstructor
@Getter
@Builder
@AllArgsConstructor
public class MakerTeam {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "NAME")
    private String name;

    @OneToMany(mappedBy = "team")
    private List<MakerTeamMember> members;

    @Setter
    @Column(name = "IS_INDIVIDUAL")
    private boolean isIndividual;
}
