package com.crimecat.backend.guild.dto.bot;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GuildNameUpdateRequestDto {
    
    @NotBlank(message = "Guild name cannot be blank")
    private String name;
}