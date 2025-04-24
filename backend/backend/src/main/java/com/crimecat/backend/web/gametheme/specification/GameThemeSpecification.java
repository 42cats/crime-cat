package com.crimecat.backend.web.gametheme.specification;

import com.crimecat.backend.web.gametheme.domain.GameTheme;
import com.crimecat.backend.web.gametheme.domain.ThemeType;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class GameThemeSpecification {
    public static Specification<GameTheme> equalCategory(String type) {
        return new Specification<>() {
            @Override
            public Predicate toPredicate(Root<GameTheme> root, CriteriaQuery<?> query, CriteriaBuilder criteriaBuilder) {
                return criteriaBuilder.equal(root.type(), Integer.toString(ThemeType.valueOf(type).ordinal()));
            }
        };
    }
}
