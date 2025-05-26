package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.exception.ErrorStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamRequest {
    @NotBlank
    private String name;
}
