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
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.type(), Integer.toString(ThemeType.valueOf(type).ordinal()));
    }

    public static Specification<GameTheme> defaultSpec(UUID userId) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.and(
                criteriaBuilder.isFalse(root.get("isDeleted")),
                criteriaBuilder.or(
                        criteriaBuilder.isTrue(root.get("isPublic")),
                        criteriaBuilder.equal(root.get("author"), userId)
                )
            );
    }
}
