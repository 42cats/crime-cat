package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.exception.ErrorStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MemberRequestDto {
    private UUID userId;
    private String name;

    public void validate() {
        // userId나 name 둘 중 하나는 값이 존재해야 함
        if (userId == null && (name == null || name.isBlank())) {
            throw ErrorStatus.INVALID_INPUT.asDomainException();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MemberRequestDto that = (MemberRequestDto) o;
        return Objects.equals(userId, that.userId) || Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        if (userId != null) {
            return Objects.hash(userId);
        }
        return Objects.hash(name);
    }
}
