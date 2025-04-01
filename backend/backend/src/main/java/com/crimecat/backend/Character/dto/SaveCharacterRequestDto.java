package com.crimecat.backend.Character.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class SaveCharacterRequestDto {
	private String guildSnowflake;
	private String characterName;
	private List<String> roles = new ArrayList<>();
}
