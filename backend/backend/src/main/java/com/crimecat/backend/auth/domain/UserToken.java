package com.crimecat.backend.auth.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "user_tokens")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserToken {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "web_user_id", nullable = false)
    private WebUser webUser;

    private String provider;

    @Column(name = "refresh_token", nullable = false, columnDefinition = "TEXT")
    private String refreshToken;

    private String jti;

    @Column(name = "expires_at", nullable = false)
    private Date expiresAt;

    @Column(name = "created_at", updatable = false, insertable = false, columnDefinition = "timestamp default current_timestamp")
    private Date createdAt;

    @Column(name = "updated_at", insertable = false, columnDefinition = "timestamp default current_timestamp on update current_timestamp")
    private Date updatedAt;
}
