package com.crimecat.backend.gametheme.specification;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.domain.MakerTeam;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.webUser.domain.WebUser;
import io.micrometer.common.util.StringUtils;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
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
//            Join<GameTheme, WebUser> authorJoin = root.join("author", JoinType.LEFT);
            String pattern = String.format("%%%s%%", keyword);
            predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(root.get("title"), pattern),
                    criteriaBuilder.like(root.get("content"), pattern),
                    criteriaBuilder.like(root.get("summary"), pattern),
//                    criteriaBuilder.like(root.get("tags"), pattern),
                    criteriaBuilder.like(root.get("author").get("nickname"), pattern)
//                    criteriaBuilder.like(authorJoin.get("nickname"), pattern)
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
}
