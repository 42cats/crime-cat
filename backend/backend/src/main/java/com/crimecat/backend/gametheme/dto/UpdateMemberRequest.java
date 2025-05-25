package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class UpdateMemberRequest {
    private String name;
    private boolean leader;
}
