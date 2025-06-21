package com.crimecat.backend.rockcat.common.dto.music;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class YouTubeMusicDto {
    private String id;
    private String title;
    private String youtubeUrl;
    private String thumbnail;
    private String duration;
    private LocalDateTime createdAt;
}