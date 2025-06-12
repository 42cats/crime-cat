package com.crimecat.backend.sitemap.service;

import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.command.repository.CommandRepository;
import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.notice.repository.NoticeRepository;
import com.crimecat.backend.userPost.repository.UserPostRepository;
import com.crimecat.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * SPA용 동적 사이트맵 생성 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SitemapService {
    
    private final GameThemeRepository gameThemeRepository;
    private final BoardPostRepository boardPostRepository;
    private final UserRepository userRepository;
    private final UserPostRepository userPostRepository;
    private final NoticeRepository noticeRepository;
    private final CommandRepository commandRepository;
    
    private static final String BASE_URL = "https://mystery-place.com";
    private static final DateTimeFormatter ISO_DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    /**
     * 사이트맵 인덱스 생성
     */
    @Cacheable(value = CacheType.SITEMAP_INDEX, key = "'index'")
    public String generateSitemapIndex() {
        log.info("사이트맵 인덱스 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        String now = LocalDateTime.now().format(ISO_DATE_FORMAT);
        
        // 정적 사이트맵
        addSitemapEntry(xml, "/sitemap.xml", now);
        
        // 동적 사이트맵들
        addSitemapEntry(xml, "/api/sitemap/themes.xml", now);
        addSitemapEntry(xml, "/api/sitemap/posts.xml", now);
        addSitemapEntry(xml, "/api/sitemap/profiles.xml", now);
        addSitemapEntry(xml, "/api/sitemap/sns.xml", now);
        addSitemapEntry(xml, "/api/sitemap/notices.xml", now);
        addSitemapEntry(xml, "/api/sitemap/commands.xml", now);
        addSitemapEntry(xml, "/api/sitemap/game-themes.xml", now);
        
        xml.append("</sitemapindex>");
        
        log.info("사이트맵 인덱스 생성 완료");
        return xml.toString();
    }
    
    /**
     * 테마 사이트맵 생성
     */
    @Cacheable(value = CacheType.SITEMAP_THEMES, key = "'themes'")
    public String generateThemesSitemap() {
        log.info("테마 사이트맵 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        // 모든 테마 조회 후 타입별로 분류
        List<GameTheme> allThemes = gameThemeRepository.findAll();
        int crimeSceneCount = 0;
        int escapeRoomCount = 0;
        
        for (GameTheme theme : allThemes) {
            String categoryPath = null;
            
            // Discriminator를 사용한 타입 구분
            String discriminator = theme.getDiscriminator();
            if ("CRIMESCENE".equals(discriminator)) {
                categoryPath = "/themes/crimescene/";
                crimeSceneCount++;
            } else if ("ESCAPE_ROOM".equals(discriminator)) {
                categoryPath = "/themes/escape_room/";
                escapeRoomCount++;
            }
            
            if (categoryPath != null) {
                addUrlEntry(xml, categoryPath + theme.getId(), 
                    theme.getUpdatedAt(), "weekly", "0.8");
            }
        }
        
        xml.append("</urlset>");
        
        int totalThemes = crimeSceneCount + escapeRoomCount;
        log.info("테마 사이트맵 생성 완료: {}개 테마 (크라임씬: {}, 방탈출: {})", totalThemes, crimeSceneCount, escapeRoomCount);
        
        return xml.toString();
    }
    
    /**
     * 커뮤니티 게시글 사이트맵 생성
     */
    @Cacheable(value = CacheType.SITEMAP_POSTS, key = "'posts'")
    public String generatePostsSitemap() {
        log.info("게시글 사이트맵 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        int totalPosts = 0;
        
        // 각 게시판 타입별 최신 게시글들
        for (BoardType boardType : BoardType.values()) {
            var posts = boardPostRepository.findByBoardTypeOrderByCreatedAtDesc(
                boardType, PageRequest.of(0, 100));
            
            String boardPath = getBoardPath(boardType);
            for (var post : posts) {
                addUrlEntry(xml, "/community/" + boardPath + "/" + post.getId(), 
                    post.getUpdatedAt(), "daily", "0.7");
                totalPosts++;
            }
        }
        
        xml.append("</urlset>");
        
        log.info("게시글 사이트맵 생성 완료: {}개 게시글", totalPosts);
        return xml.toString();
    }
    
    /**
     * 프로필 사이트맵 생성
     */
    @Cacheable(value = CacheType.SITEMAP_PROFILES, key = "'profiles'")
    public String generateProfilesSitemap() {
        log.info("프로필 사이트맵 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        // 활성 사용자들 (최근 30일 내 활동)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        var activeUsers = userRepository.findActiveUsersForSitemap(thirtyDaysAgo, PageRequest.of(0, 500));
        
        for (var user : activeUsers) {
            addUrlEntry(xml, "/profile/" + user.getId(), 
                user.getUpdatedAt(), "weekly", "0.6");
        }
        
        xml.append("</urlset>");
        
        log.info("프로필 사이트맵 생성 완료: {}개 프로필", activeUsers.size());
        return xml.toString();
    }
    
    /**
     * SNS 게시물 사이트맵 생성
     */
    @Cacheable(value = CacheType.SITEMAP_SNS, key = "'sns'")
    public String generateSnsSitemap() {
        log.info("SNS 사이트맵 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        // 공개 SNS 게시물들
        var publicPosts = userPostRepository.findPublicPostsForSitemap(PageRequest.of(0, 200));
        
        for (var post : publicPosts) {
            addUrlEntry(xml, "/sns/post/" + post.getId(), 
                post.getUpdatedAt(), "daily", "0.6");
        }
        
        xml.append("</urlset>");
        
        log.info("SNS 사이트맵 생성 완료: {}개 게시물", publicPosts.size());
        return xml.toString();
    }
    
    /**
     * 공지사항 사이트맵 생성
     */
    @Cacheable(value = CacheType.SITEMAP_NOTICES, key = "'notices'")
    public String generateNoticesSitemap() {
        log.info("공지사항 사이트맵 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        // 최신 공지사항들
        var notices = noticeRepository.findTop100ByOrderByCreatedAtDesc();
        
        for (var notice : notices) {
            addUrlEntry(xml, "/notices/" + notice.getId(), 
                notice.getUpdatedAt(), "weekly", "0.7");
        }
        
        xml.append("</urlset>");
        
        log.info("공지사항 사이트맵 생성 완료: {}개 공지", notices.size());
        return xml.toString();
    }
    
    /**
     * 사이트맵 엔트리 추가
     */
    private void addSitemapEntry(StringBuilder xml, String loc, String lastmod) {
        xml.append("  <sitemap>\n");
        xml.append("    <loc>").append(BASE_URL).append(loc).append("</loc>\n");
        xml.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        xml.append("  </sitemap>\n");
    }
    
    /**
     * URL 엔트리 추가
     */
    private void addUrlEntry(StringBuilder xml, String loc, LocalDateTime lastmod, 
                           String changefreq, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(BASE_URL).append(loc).append("</loc>\n");
        if (lastmod != null) {
            xml.append("    <lastmod>").append(lastmod.format(ISO_DATE_FORMAT)).append("</lastmod>\n");
        }
        xml.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n");
    }
    
    /**
     * 명령어 사이트맵 생성
     */
    @Cacheable(value = CacheType.SITEMAP_COMMANDS, key = "'commands'")
    public String generateCommandsSitemap() {
        log.info("명령어 사이트맵 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        // 명령어 목록 페이지
        addUrlEntry(xml, "/commands", LocalDateTime.now(), "weekly", "0.8");
        
        // 개별 명령어 상세 페이지
        var commands = commandRepository.findTop100ByOrderByCreatedAtDesc(PageRequest.of(0, 100));
        
        for (var command : commands) {
            addUrlEntry(xml, "/commands/" + command.getId(), 
                command.getUpdatedAt(), "monthly", "0.7");
        }
        
        xml.append("</urlset>");
        
        log.info("명령어 사이트맵 생성 완료: {}개 명령어", commands.size());
        return xml.toString();
    }
    
    /**
     * 게임테마 API 사이트맵 생성 (공개 API 엔드포인트용)
     */
    @Cacheable(value = CacheType.SITEMAP_GAME_THEMES, key = "'game_themes'")
    public String generateGameThemesSitemap() {
        log.info("게임테마 API 사이트맵 생성 시작");
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        
        // 카테고리별 테마 목록 페이지
        addUrlEntry(xml, "/api/v1/public/themes", LocalDateTime.now(), "daily", "0.9");
        addUrlEntry(xml, "/api/v1/public/themes/crimescene", LocalDateTime.now(), "daily", "0.8");
        addUrlEntry(xml, "/api/v1/public/themes/escape-room", LocalDateTime.now(), "daily", "0.8");
        
        // 개별 테마 상세 페이지 (모든 타입)
        List<GameTheme> allThemes = gameThemeRepository.findAll();
        for (GameTheme theme : allThemes) {
            String discriminator = theme.getDiscriminator();
            String categoryPath = null;
            
            if ("CRIMESCENE".equals(discriminator)) {
                categoryPath = "/api/v1/public/themes/crimescene/";
            } else if ("ESCAPE_ROOM".equals(discriminator)) {
                categoryPath = "/api/v1/public/themes/escape-room/";
            }
            
            if (categoryPath != null) {
                addUrlEntry(xml, categoryPath + theme.getId(), 
                    theme.getUpdatedAt(), "weekly", "0.7");
            }
            
            // 공통 테마 엔드포인트도 추가
            addUrlEntry(xml, "/api/v1/public/themes/" + theme.getId(), 
                theme.getUpdatedAt(), "weekly", "0.7");
        }
        
        xml.append("</urlset>");
        
        log.info("게임테마 API 사이트맵 생성 완료: {}개 테마", allThemes.size());
        return xml.toString();
    }
    
    /**
     * 게시판 타입을 경로로 변환
     */
    private String getBoardPath(BoardType boardType) {
        return switch (boardType) {
            case QUESTION -> "question";
            case CHAT -> "chat";
            case CREATOR -> "creator";
        };
    }
}