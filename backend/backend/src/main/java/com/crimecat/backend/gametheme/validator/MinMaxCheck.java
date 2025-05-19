package com.crimecat.backend.gametheme.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;


@Repeatable(MinMaxChecks.class)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MinMaxValidator.class)
public @interface MinMaxCheck {
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    String min();
    String max();
    String message() default "";
}
