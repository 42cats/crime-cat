package com.crimecat.backend.webUser.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.crimecat.backend.webUser.domain.WebUser;

public interface WebUserRepository extends JpaRepository<WebUser, UUID> {
    @Override
    Optional<WebUser> findById(UUID uuid);

    Optional<WebUser> findWebUserByDiscordUserSnowflake(String discordUserId);

    Optional<WebUser> findWebUserByEmail(String email);

    Optional<WebUser> findByNickname(String nickname);
    
    /**
     * 닉네임에 키워드가 포함된 사용자 검색 (부분 일치)
     * @param keyword 검색 키워드
     * @param pageable 페이징 정보
     * @return 페이징된 WebUser 목록
     */
    @Query("SELECT w FROM WebUser w WHERE w.nickname LIKE CONCAT('%', :keyword, '%')")
    Page<WebUser> findByNicknameContaining(@Param("keyword") String keyword, Pageable pageable);
    
    /**
     * Discord Snowflake로 사용자 검색
     * @param discordSnowflake Discord Snowflake ID
     * @param pageable 페이징 정보
     * @return 페이징된 WebUser 목록
     */
    Page<WebUser> findByDiscordUserSnowflake(String discordSnowflake, Pageable pageable);
}
