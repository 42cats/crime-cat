package com.crimecat.backend.command.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommandListResponseDto {

    @Builder.Default
    private List<CommandSummaryDto> data = new ArrayList<>();

}
