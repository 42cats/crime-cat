package com.crimecat.backend.rockcat.common.dto.music;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LocalMusicFileDto {
    private String id;
    private String title;
    private String filename;
    private String filePath;
    private long size;
    private String duration;
    private String extension;
}