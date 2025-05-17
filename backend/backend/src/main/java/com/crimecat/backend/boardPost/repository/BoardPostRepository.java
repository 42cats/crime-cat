package com.crimecat.backend.boardPost.repository;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BoardPostRepository extends JpaRepository<BoardPost, UUID> {

    @Query("select "
            + "distinct p "
            + "from BoardPost p "
            + "left outer join WebUser u1 on p.user=u1 "
            + "left outer join PostComment c on c.boardPost=p "
            + "left outer join WebUser u2 on c.user=u2 "
            + "where ("
            + "   p.subject like %:kw% "
            + "   or p.content like %:kw% "
            + "   or u1.nickname like %:kw% "
            + "   or c.content like %:kw% "
            + "   or u2.nickname like %:kw% "
            + ") "
            + " and p.boardtype = :boardType "
            + " and p.postType = :postType "
            + " and p.isDeleted = false "
            + " ORDER BY p.isPinned DESC ")
    Page<BoardPost> findAllByKeywordAndTypeAndIsDeletedFalse(
            @Param("kw") String kw,
            @Param("boardType") BoardType boardType,
            @Param("boardType") PostType postType,
            Pageable pageable
    );
}
