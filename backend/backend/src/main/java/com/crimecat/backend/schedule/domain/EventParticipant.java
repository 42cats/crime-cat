package com.crimecat.backend.schedule.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_participants", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipant {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private WebUser user;

    @Column(nullable = false)
    private String status;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
