package com.crimecat.backend.schedule.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class EventCreateRequest {
    private String title;
    private String description;
    private String category;
    private Integer maxParticipants;
}
