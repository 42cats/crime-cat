package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.exception.ErrorStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CreateTeamRequest {
    @NotBlank
    private String name;
}
