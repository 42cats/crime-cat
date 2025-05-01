package com.crimecat.backend.guild.dto.web;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ApiGetGuildInfoDto {
        private String id;
        private String name;
        private String icon;

        private String ownerId;

        private Integer approximateMemberCount;
        private Integer approximatePresenceCount;

        private List<RoleDto> roles;
}
