package com.crimecat.backend.command.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandListResponseDto {

    @Builder.Default
    private List<CommandSummaryDto> data = new ArrayList<>();

}
