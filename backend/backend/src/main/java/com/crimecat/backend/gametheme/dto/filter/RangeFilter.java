package com.crimecat.backend.gametheme.dto.filter;

import com.crimecat.backend.gametheme.enums.RangeType;
import lombok.Data;

import java.util.Optional;

@Data
public class RangeFilter {
    private int min;
    private int max;
    private RangeType type;

    public RangeFilter(int min, int max, RangeType type) {
        this.min = min;
        this.max = max;
        this.type = type;
    }

    public static RangeFilter of(Integer min, Integer max, RangeType type) {
        if (min == null) {
            min = 0;
        }
        if (max == null) {
            max = Integer.MAX_VALUE;
        }
        return new RangeFilter(min, max, type);
    }
}
