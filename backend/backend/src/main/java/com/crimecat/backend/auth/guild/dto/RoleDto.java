package com.crimecat.backend.auth.guild.dto;

import lombok.Data;

@Data
public class RoleDto {
    private String id;
    private String name;
    private String description;
    private String permissions;
    private int position;
    private int color;
    private boolean hoist;
    private boolean managed;
    private boolean mentionable;
    private String icon;
    private String unicodeEmoji;
    private int flags;
    private RoleTags tags;
}
