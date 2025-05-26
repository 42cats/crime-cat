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
            + "left outer join PostComment c on c.content=p "
            + "left outer join WebUser u2 on c.user=u2 "
            + "where ("
            + "   p.subject like %:kw% "
            + "   or p.content like %:kw% "
            + "   or u1.nickname like %:kw% "
            + "   or c.content like %:kw% "
            + "   or u2.nickname like %:kw% "
            + ") "
            + " and p.boardType = :boardType "
            + " and p.isDeleted = false "
            + " ORDER BY p.isPinned DESC, p.createdAt DESC ")
    Page<BoardPost> findAllByKeywordAndBoardTypeAndIsDeletedFalse(
            @Param("kw") String kw,
            @Param("boardType") BoardType boardType,
            Pageable pageable
    );
    
    @Query("select "
            + "distinct p "
            + "from BoardPost p "
            + "left join fetch p.author u1 "
            + "left outer join PostComment c on c.content=p "
            + "left outer join WebUser u2 on c.user=u2 "
            + "where ("
            + "   p.subject like %:kw% "
            + "   or p.content like %:kw% "
            + "   or u1.nickname like %:kw% "
            + "   or c.content like %:kw% "
            + "   or u2.nickname like %:kw% "
            + ") "
            + " and p.boardType = :boardType "
            + " and p.postType = :postType "
            + " and p.isDeleted = false "
            + " ORDER BY p.isPinned DESC, p.createdAt DESC ")
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

}
