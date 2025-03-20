package com.crimecat.backend.guild.domain;

import com.crimecat.backend.user.domain.User;
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

@Entity
@Table(name = "GUILDS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Guild {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "SNOWFLAKE", nullable = false)
    private String snowflake;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "IS_WITHDRAW", nullable = false)
    private boolean isWithdraw;

    @JoinColumn(name = "OWNER_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;
}
