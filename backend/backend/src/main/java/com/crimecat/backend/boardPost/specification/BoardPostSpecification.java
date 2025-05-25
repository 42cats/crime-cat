package com.crimecat.backend.boardPost.specification;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.domain.PostComment;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class BoardPostSpecification {

    public static Specification<BoardPost> searchByKeywordAndType(String keyword, BoardType boardType, PostType postType) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // isDeleted = false 조건
            predicates.add(criteriaBuilder.equal(root.get("isDeleted"), false));
            
            // boardType 조건 (NONE이 아닌 경우에만 적용)
            if (boardType != null && boardType != BoardType.NONE) {
                predicates.add(criteriaBuilder.equal(root.get("boardType"), boardType));
            }
            
            // postType 조건 (GENERAL이 아닌 특정 타입을 원하는 경우에만 적용)
            if (postType != null && postType != PostType.GENERAL) {
                predicates.add(criteriaBuilder.equal(root.get("postType"), postType));
            }
            
            // 키워드 검색 조건
            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchPattern = "%" + keyword.trim() + "%";
                
                // 작성자 조인
                Join<BoardPost, WebUser> authorJoin = root.join("author", JoinType.LEFT);
                
                // 댓글 조인
                Join<BoardPost, PostComment> commentJoin = root.join("comments", JoinType.LEFT);
                Join<PostComment, WebUser> commentAuthorJoin = commentJoin.join("author", JoinType.LEFT);
                
                // OR 조건들
                Predicate keywordPredicate = criteriaBuilder.or(
                    criteriaBuilder.like(root.get("subject"), searchPattern),
                    criteriaBuilder.like(root.get("content"), searchPattern),
                    criteriaBuilder.like(authorJoin.get("nickname"), searchPattern),
                    criteriaBuilder.like(commentJoin.get("content"), searchPattern),
                    criteriaBuilder.like(commentAuthorJoin.get("nickname"), searchPattern)
                );
                
                predicates.add(keywordPredicate);
            }
            
            // DISTINCT 설정
            query.distinct(true);
            
            // ORDER BY isPinned DESC, createdAt DESC
            query.orderBy(
                criteriaBuilder.desc(root.get("isPinned")),
                criteriaBuilder.desc(root.get("createdAt"))
            );
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}