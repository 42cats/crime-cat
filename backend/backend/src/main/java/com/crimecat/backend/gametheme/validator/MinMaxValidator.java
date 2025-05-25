package com.crimecat.backend.gametheme.validator;

import com.crimecat.backend.utils.ObjectUtil;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class MinMaxValidator implements ConstraintValidator<MinMaxCheck, Object> {
    private String min;
    private String max;

    @Override
    public void initialize(MinMaxCheck constraintAnnotation) {
        min = constraintAnnotation.min();
        max = constraintAnnotation.max();
    }

    @Override
    public boolean isValid(Object o, ConstraintValidatorContext constraintValidatorContext) {
        try {
            Integer minValue = ObjectUtil.getField(o, min, Integer.class);
            Integer maxValue = ObjectUtil.getField(o, max, Integer.class);
            // patch request의 부분 업데이트 시 null값 처리를 위한 조건
            if (minValue == null || maxValue == null) {
                return true;
            }
            return minValue <= maxValue;
        } catch (Exception e) {
            return false;
        }
    }
}
