package com.crimecat.backend.permission.domain;

import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "PERMISSIONS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Permission {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "PRICE", nullable = false)
    private Integer price;

    @Column(name = "DURATION")
    private Integer duration = 28;

    public Permission(String name, Integer price, Integer duration) {
        this.name = name;
        this.price = price;
        if (duration != null) {
            this.duration = duration;
        }
    }

    public void modifyPermission(String name, Integer price, Integer duration) {
        if (name != null) {
            this.name = name;
        }
        if (price != null) {
            this.price = price;
        }
        if (duration != null) {
            this.duration = duration;
        }
    }
}
