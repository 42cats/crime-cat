package com.crimecat.backend.web.messagemacro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;


@Data @Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDto {
    @NotNull
    private UUID id;
    @NotBlank
    private String name;
    @Min(0)
    private int index;
    private List<ButtonDto> buttons;
}