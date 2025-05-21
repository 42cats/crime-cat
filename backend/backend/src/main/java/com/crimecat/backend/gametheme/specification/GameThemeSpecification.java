package com.crimecat.backend.gametheme.specification;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.domain.MakerTeam;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.gametheme.dto.filter.RangeFilter;
import com.crimecat.backend.gametheme.enums.RangeType;
import com.crimecat.backend.gametheme.enums.ThemeType;
import io.micrometer.common.util.StringUtils;
import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public class GameThemeSpecification {
    public static Specification<GameTheme> equalCategory(String type) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.type(), Integer.toString(ThemeType.valueOf(type).ordinal()));
    }

    public static Specification<GameTheme> defaultSpec(UUID userId) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.and(
                criteriaBuilder.isFalse(root.get("isDeleted")),
                criteriaBuilder.or(
                        criteriaBuilder.isTrue(root.get("publicStatus")),
                        criteriaBuilder.equal(root.get("authorId"), userId)
                )
            );
    }

    public static Specification<GameTheme> findKeyword(String keyword, String category) {
        return (root, query, criteriaBuilder) -> {
            if (StringUtils.isEmpty(keyword)) {
                return criteriaBuilder.conjunction();
            }
            List<Predicate> predicates = new ArrayList<>();
            String pattern = String.format("%%%s%%", keyword);
            
            // 기본 텍스트 필드 검색
            predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(root.get("title"), pattern),
                    criteriaBuilder.like(root.get("content"), pattern),
                    criteriaBuilder.like(root.get("summary"), pattern),
                    criteriaBuilder.like(root.get("author").get("nickname"), pattern)
            ));
            
            // JSON 태그 필드 검색 - MySQL JSON_SEARCH 함수 사용
            predicates.add(criteriaBuilder.isNotNull(
                criteriaBuilder.function(
                    "JSON_SEARCH", 
                    String.class,
                    root.get("tags"), 
                    criteriaBuilder.literal("one"), 
                    criteriaBuilder.literal(pattern)
                )
            ));
            if (ThemeType.Values.CRIMESCENE.equals(category)) {
                Root<CrimesceneTheme> crimesceneThemeRoot = criteriaBuilder.treat(root, CrimesceneTheme.class);
                Join<CrimesceneTheme, MakerTeam> teamJoin = crimesceneThemeRoot.join("team", JoinType.LEFT);
                Join<MakerTeam, MakerTeamMember> memberJoin = teamJoin.join("members", JoinType.LEFT);
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(teamJoin.get("name"), pattern),
                        criteriaBuilder.like(memberJoin.get("webUser").get("nickname"), pattern),
                        criteriaBuilder.like(memberJoin.get("name"), pattern)
                ));
            }
            return criteriaBuilder.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<GameTheme> findIntRange(RangeFilter range) {
        return (root, query, criteriaBuilder) -> {
            RangeType type = range.getType();
            if (type.seperated) {
                return criteriaBuilder.and(
                        criteriaBuilder.ge(root.get(type.min), range.getMin()),
                        criteriaBuilder.le(root.get(type.max), range.getMax())
                );
            }
            return criteriaBuilder.between(root.get(type.min), range.getMin(), range.getMax());
        };
    }
}
