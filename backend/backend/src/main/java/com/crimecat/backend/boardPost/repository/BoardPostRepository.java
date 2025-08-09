package com.crimecat.backend.boardPost.repository;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardPostRepository extends JpaRepository<BoardPost, UUID>, JpaSpecificationExecutor<BoardPost> {

    @Query("select "
            + "distinct p "
            + "from BoardPost p "
            + "left join fetch p.author u1 "
            + "left outer join PostComment c on c.boardPost=p "
            + "left outer join WebUser u2 on c.author=u2 "
            + "where ("
            + "   p.subject like %:kw% "
            + "   or p.content like %:kw% "
            + "   or u1.nickname like %:kw% "
            + "   or c.content like %:kw% "
            + "   or u2.nickname like %:kw% "
            + ") "
            + " and p.boardType = :boardType "
            + " and p.isDeleted = false ")
    Page<BoardPost> findAllByKeywordAndBoardTypeAndIsDeletedFalse(
            @Param("kw") String kw,
            @Param("boardType") BoardType boardType,
            Pageable pageable
    );
    
    @Query("select "
            + "distinct p "
            + "from BoardPost p "
            + "left join fetch p.author u1 "
            + "left outer join PostComment c on c.boardPost=p "
            + "left outer join WebUser u2 on c.author=u2 "
            + "where ("
            + "   p.subject like %:kw% "
            + "   or p.content like %:kw% "
            + "   or u1.nickname like %:kw% "
            + "   or c.content like %:kw% "
            + "   or u2.nickname like %:kw% "
            + ") "
            + " and p.boardType = :boardType "
            + " and p.postType = :postType "
            + " and p.isDeleted = false ")
    Page<BoardPost> findAllByKeywordAndTypeAndIsDeletedFalse(
            @Param("kw") String kw,
            @Param("boardType") BoardType boardType,
            @Param("postType") PostType postType,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"author"})
    Optional<BoardPost> findByIdAndIsDeletedFalse(UUID id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE BoardPost p SET p.views = p.views + 1 WHERE p.id = :postId")
    void incrementViews(@Param("postId") UUID postId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE BoardPost p SET p.comments = :comments WHERE p.id = :postId")
    void updateComments(@Param("postId") UUID postId, int comments);

    /**
     * 사이트맵용 게시글 조회 (보드 타입별, 최신순)
     */
    @Query("SELECT p FROM BoardPost p WHERE p.boardType = :boardType AND p.isDeleted = false ORDER BY p.createdAt DESC")
    java.util.List<BoardPost> findByBoardTypeOrderByCreatedAtDesc(@Param("boardType") BoardType boardType, Pageable pageable);

    /**
     * 이전글 조회 (현재 게시글보다 오래된 글 중 가장 최신, 핀된 게시글 제외)
     */
    @Query("SELECT p FROM BoardPost p " +
           "LEFT JOIN FETCH p.author " +
           "WHERE p.boardType = :boardType " +
           "AND p.createdAt < :currentCreatedAt " +
           "AND p.isDeleted = false " +
           "AND p.isPinned = false " +
           "ORDER BY p.createdAt DESC")
    java.util.List<BoardPost> findPreviousPost(
            @Param("boardType") BoardType boardType,
            @Param("currentCreatedAt") java.time.LocalDateTime currentCreatedAt,
            Pageable pageable
    );

    /**
     * 다음글 조회 (현재 게시글보다 최신 글 중 가장 오래된, 핀된 게시글 제외)
     */
    @Query("SELECT p FROM BoardPost p " +
           "LEFT JOIN FETCH p.author " +
           "WHERE p.boardType = :boardType " +
           "AND p.createdAt > :currentCreatedAt " +
           "AND p.isDeleted = false " +
           "AND p.isPinned = false " +
           "ORDER BY p.createdAt ASC")
    java.util.List<BoardPost> findNextPost(
            @Param("boardType") BoardType boardType,
            @Param("currentCreatedAt") java.time.LocalDateTime currentCreatedAt,
            Pageable pageable
    );

}
