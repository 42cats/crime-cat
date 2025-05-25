package com.crimecat.backend.userPost.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserPostRequest {
    @NotBlank
    private String content;
    
    private boolean isPrivate = false;
    private boolean isFollowersOnly = false;
}
