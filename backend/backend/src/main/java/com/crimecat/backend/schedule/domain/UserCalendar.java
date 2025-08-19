package com.crimecat.backend.schedule.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_calendars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private WebUser user;

    @Column(nullable = false, length = 2048)
    private String icalUrl;

    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
