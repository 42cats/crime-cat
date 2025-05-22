package com.crimecat.backend.userPost.domain.collection;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "collections", uniqueConstraints = {
        @UniqueConstraint(name = "uk_collections_user_name", columnNames = {"user_id", "name"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Collection {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_collections_user"))
    private WebUser user;
    
    @Column(name = "name", nullable = false, length = 50)
    private String name;
    
    @Column(name = "description", length = 200)
    private String description;
    
    @Column(name = "is_private", nullable = false)
    @Builder.Default
    private Boolean isPrivate = false;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public static Collection create(WebUser user, String name, String description, Boolean isPrivate) {
        return Collection.builder()
                .user(user)
                .name(name)
                .description(description)
                .isPrivate(isPrivate != null ? isPrivate : false)
                .build();
    }
    
    public void updateInfo(String name, String description, Boolean isPrivate) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name.trim();
        }
        if (description != null) {
            this.description = description.trim().isEmpty() ? null : description.trim();
        }
        if (isPrivate != null) {
            this.isPrivate = isPrivate;
        }
    }
    
    public boolean isOwnedBy(WebUser user) {
        return this.user.getId().equals(user.getId());
    }
}