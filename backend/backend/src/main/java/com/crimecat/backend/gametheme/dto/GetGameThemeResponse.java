package com.crimecat.backend.gametheme.dto;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class GetGameThemeResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private GameThemeDetailDto theme;
}
