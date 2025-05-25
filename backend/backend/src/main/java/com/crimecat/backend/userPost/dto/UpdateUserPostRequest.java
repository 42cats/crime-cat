package com.crimecat.backend.userPost.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserPostRequest {
    @NotBlank
    private String content;
    
    private boolean isPrivate = false;
    private boolean isFollowersOnly = false;
}