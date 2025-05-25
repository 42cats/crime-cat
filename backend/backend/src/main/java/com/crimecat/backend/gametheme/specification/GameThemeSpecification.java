package com.crimecat.backend.gametheme.specification;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.domain.EscapeRoomLocation;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.domain.MakerTeam;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.gametheme.dto.filter.RangeFilter;
import com.crimecat.backend.gametheme.enums.RangeType;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.location.service.LocationMappingService;
import io.micrometer.common.util.StringUtils;
import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public class GameThemeSpecification {
    public static Specification<GameTheme> equalCategory(String type) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.type(), type);
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

    public static Specification<GameTheme> findKeyword(String keyword, String category, LocationMappingService locationMappingService) {
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
            
            // 방탈출 테마 전용 검색 (최적화된 JOIN 사용)
            if (ThemeType.Values.ESCAPE_ROOM.equals(category)) {
                Root<EscapeRoomTheme> escapeRoomThemeRoot = criteriaBuilder.treat(root, EscapeRoomTheme.class);
                
                // 매장 위치 검색 - 정규화된 테이블 JOIN (인덱스 활용)
                Join<EscapeRoomTheme, EscapeRoomLocation> locationJoin = escapeRoomThemeRoot.join("locations", JoinType.LEFT);
                
                // 지역 매핑 서비스를 사용하여 확장된 검색어 가져오기
                List<String> expandedTerms = locationMappingService.getExpandedSearchTerms(keyword);
                List<Predicate> locationPredicates = new ArrayList<>();
                
                for (String term : expandedTerms) {
                    String termPattern = String.format("%%%s%%", term.toLowerCase());
                    locationPredicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(locationJoin.get("storeName")), termPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(locationJoin.get("address")), termPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(locationJoin.get("roadAddress")), termPattern)
                    ));
                }
                
                predicates.add(criteriaBuilder.or(locationPredicates.toArray(new Predicate[0])));
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


    /**
     * 방탈출 테마의 매장명으로 검색 (최적화된 JOIN)
     */
    public static Specification<GameTheme> hasStoreName(String storeName) {
        return (root, query, criteriaBuilder) -> {
            if (StringUtils.isEmpty(storeName)) {
                return criteriaBuilder.conjunction();
            }
            
            Root<EscapeRoomTheme> escapeRoomThemeRoot = criteriaBuilder.treat(root, EscapeRoomTheme.class);
            Join<EscapeRoomTheme, EscapeRoomLocation> locationJoin = escapeRoomThemeRoot.join("locations", JoinType.INNER);
            
            String pattern = String.format("%%%s%%", storeName.toLowerCase());
            return criteriaBuilder.like(
                criteriaBuilder.lower(locationJoin.get("storeName")), 
                pattern
            );
        };
    }

    /**
     * 방탈출 테마의 별점 범위 검색 (공포도, 장치비중, 활동도)
     */
    public static Specification<GameTheme> hasStarRatingRange(String ratingType, Integer minRating, Integer maxRating) {
        return (root, query, criteriaBuilder) -> {
            if (StringUtils.isEmpty(ratingType) || minRating == null || maxRating == null) {
                return criteriaBuilder.conjunction();
            }
            
            Root<EscapeRoomTheme> escapeRoomThemeRoot = criteriaBuilder.treat(root, EscapeRoomTheme.class);
            
            // ratingType: "horrorLevel", "deviceRatio", "activityLevel"
            Path<Integer> ratingPath = escapeRoomThemeRoot.get(ratingType);
            
            return criteriaBuilder.and(
                criteriaBuilder.isNotNull(ratingPath),
                criteriaBuilder.between(ratingPath, minRating, maxRating)
            );
        };
    }

    /**
     * 방탈출 테마의 운영 상태로 검색
     */
    public static Specification<GameTheme> isOperating(Boolean isOperating) {
        return (root, query, criteriaBuilder) -> {
            if (isOperating == null) {
                return criteriaBuilder.conjunction();
            }
            
            Root<EscapeRoomTheme> escapeRoomThemeRoot = criteriaBuilder.treat(root, EscapeRoomTheme.class);
            return criteriaBuilder.equal(escapeRoomThemeRoot.get("isOperating"), isOperating);
        };
    }
    
    /**
     * 사용자의 플레이 여부로 검색
     * @param userId 사용자 ID
     * @param hasPlayed true: 플레이한 테마만, false: 플레이하지 않은 테마만, null: 전체
     */
    public static Specification<GameTheme> hasBeenPlayedByUser(UUID userId, Boolean hasPlayed) {
        return (root, query, criteriaBuilder) -> {
            if (userId == null || hasPlayed == null) {
                return criteriaBuilder.conjunction();
            }
            
            // EscapeRoomTheme으로 타입 캐스트
            Root<EscapeRoomTheme> escapeRoomThemeRoot = criteriaBuilder.treat(root, EscapeRoomTheme.class);
            
            // EscapeRoomHistory와 연관된 테마 ID를 가져오는 서브쿼리
            Subquery<UUID> subquery = query.subquery(UUID.class);
            Root<EscapeRoomHistory> historyRoot = subquery.from(EscapeRoomHistory.class);
            
            subquery.select(historyRoot.get("escapeRoomTheme").get("id"))
                    .where(criteriaBuilder.equal(historyRoot.get("webUser").get("id"), userId));
            
            if (hasPlayed) {
                // 플레이한 테마만
                return escapeRoomThemeRoot.get("id").in(subquery);
            } else {
                // 플레이하지 않은 테마만
                return criteriaBuilder.not(escapeRoomThemeRoot.get("id").in(subquery));
            }
        };
    }
}
