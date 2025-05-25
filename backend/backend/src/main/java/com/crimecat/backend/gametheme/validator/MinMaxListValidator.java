package com.crimecat.backend.gametheme.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class MinMaxListValidator implements ConstraintValidator<MinMaxChecks, Object> {
    private MinMaxCheck[] checks;
    private MinMaxValidator validator;

    @Override
    public void initialize(MinMaxChecks constraintAnnotation) {
        checks = constraintAnnotation.value();
        validator = new MinMaxValidator();
    }

    @Override
    public boolean isValid(Object o, ConstraintValidatorContext context) {
        for (MinMaxCheck check : checks) {
            validator.initialize(check);
            if (!validator.isValid(o, context)) {
                return false;
            }
        }
        return true;
    }
}
