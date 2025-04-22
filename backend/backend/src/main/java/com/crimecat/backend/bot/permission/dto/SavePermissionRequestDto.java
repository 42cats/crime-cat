package com.crimecat.backend.bot.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SavePermissionRequestDto {
	private String name;
	private Integer price;
	private Integer duration;
}
