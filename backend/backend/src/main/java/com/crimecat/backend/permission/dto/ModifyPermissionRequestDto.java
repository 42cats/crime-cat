package com.crimecat.backend.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class ModifyPermissionRequestDto {

	private String name;
	private Integer price;
	private Integer duration;
}
