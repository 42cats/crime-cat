package com.crimecat.backend.web.messagemacro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ContentDto {
    @NotNull
    private UUID id;
    private String text;
    @NotBlank
    private String channelId;
    @Min(0)
    private int index;
}