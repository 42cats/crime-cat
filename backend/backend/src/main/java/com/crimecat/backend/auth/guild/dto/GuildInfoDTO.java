package com.crimecat.backend.auth.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuildInfoDTO {
    private String id;
    private String name;
    private String icon; // URL
    private boolean owner;
    private Integer approximate_member_count;
    private Integer approximate_presence_count;
    private long permissions;
    private List<String> features;
}
