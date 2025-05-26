package com.crimecat.backend.userPost.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserPostRequest {
    @NotBlank
    private String content;
    
    private boolean isPrivate = false;
    private boolean isFollowersOnly = false;
}
