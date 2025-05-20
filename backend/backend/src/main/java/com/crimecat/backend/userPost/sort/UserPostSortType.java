package com.crimecat.backend.userPost.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;

public enum UserPostSortType implements SortType {

    /** 최근 작성 순(기본) */
    LATEST   (Sort.by(Sort.Direction.DESC, "createdAt")),

    /** 오래된 순 */
    OLDEST   (Sort.by(Sort.Direction.ASC , "createdAt")),

    /** 좋아요 많은 순 → 작성 시간 보조 */
    LIKES    (Sort.by(Sort.Direction.DESC, "likeCount")
            .and(Sort.by(Sort.Direction.DESC, "createdAt"))),

    /** 좋아요 적은 순 → 작성 시간 보조 */
    LIKES_ASC(Sort.by(Sort.Direction.ASC , "likeCount")
            .and(Sort.by(Sort.Direction.DESC, "createdAt")));

    private final Sort sort;
    UserPostSortType(Sort sort) { this.sort = sort; }
    @Override public Sort getSort() { return sort; }
}
