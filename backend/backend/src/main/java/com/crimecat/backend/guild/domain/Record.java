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
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "RECORD")
@NoArgsConstructor
@Getter
public class Record {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "CHANNEL_ID", nullable = false)
    private String channelId;

    @Column(name = "MESSAGE", nullable = false)
    private String message;

    @Column(name = "INDEX", nullable = false)
    private Integer index;

    @JoinColumn(name = "GUILD_SNOWFLAKE", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;
}
