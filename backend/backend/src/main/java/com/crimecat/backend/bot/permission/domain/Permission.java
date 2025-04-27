package com.crimecat.backend.bot.permission.domain;

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

    @Column(name = "INFO", length = 255)
    private String info;

    public Permission(String name, Integer price, Integer duration, String info) {
        this.name = name;
        this.price = price;
        if (duration != null) {
            this.duration = duration;
        }
        if(info != null) {
            this.info = "";
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

    public void setInfo(String info) {
        if (info != null) {
            this.info = info;
        }
    }
}
