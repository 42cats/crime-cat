package com.crimecat.backend.ssr.controller;

import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.service.GameThemeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 크롤러용 Server-Side Rendering 컨트롤러
 * 테마 페이지만 동적 메타태그 생성
 */
@Slf4j
@RestController
@RequestMapping("/api/ssr")
@RequiredArgsConstructor
public class SSRController {
    
    private final GameThemeService gameThemeService;
    
    /**
     * 크라임씬 카테고리 페이지 SSR
     */
    @Transactional(readOnly = true)
    @GetMapping(value = "/themes/crimescene", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> renderCrimeSceneList(HttpServletRequest request) {
        log.info("크라임씬 카테고리 SSR 요청: {}", request.getHeader("User-Agent"));
        
        try {
            // 크라임씬 테마 목록 조회 (최신 10개)
            List<GameTheme> themes = gameThemeService.getThemesByType("CRIMESCENE", 10);
            
            String html = generateCategoryHtml(
                "크라임씬", 
                "다양한 크라임씬 테마를 만나보세요. 추리와 수사의 재미를 느껴보세요.",
                themes, 
                request.getRequestURL().toString()
            );
            
            return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=1800") // 30분 캐시
                .body(html);
                
        } catch (Exception e) {
            log.error("크라임씬 SSR 처리 중 오류 발생", e);
            return generateFallbackHtml("크라임씬", request.getRequestURL().toString());
        }
    }
    
    /**
     * 방탈출 카테고리 페이지 SSR
     */
    @Transactional(readOnly = true)
    @GetMapping(value = "/themes/escape_room", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> renderEscapeRoomList(HttpServletRequest request) {
        log.info("방탈출 카테고리 SSR 요청: {}", request.getHeader("User-Agent"));
        
        try {
            // 방탈출 테마 목록 조회 (최신 10개)
            List<GameTheme> themes = gameThemeService.getThemesByType("ESCAPE_ROOM", 10);
            
            String html = generateCategoryHtml(
                "방탈출", 
                "짜릿한 방탈출 테마를 경험해보세요. 퍼즐과 미션의 재미를 만끽하세요.",
                themes, 
                request.getRequestURL().toString()
            );
            
            return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=1800") // 30분 캐시
                .body(html);
                
        } catch (Exception e) {
            log.error("방탈출 SSR 처리 중 오류 발생", e);
            return generateFallbackHtml("방탈출", request.getRequestURL().toString());
        }
    }
    
    /**
     * 테마 상세 페이지 SSR
     */
    @Transactional(readOnly = true)
    @GetMapping(value = "/themes/{type}/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> renderThemeDetail(
            @PathVariable String type, 
            @PathVariable String id,
            HttpServletRequest request) {
        
        log.info("테마 상세 SSR 요청: {} / {}, User-Agent: {}", type, id, request.getHeader("User-Agent"));
        
        try {
            GameTheme theme = gameThemeService.getThemeByStringId(id);
            
            if (theme == null) {
                return ResponseEntity.notFound().build();
            }
            
            String html = generateThemeDetailHtml(theme, request.getRequestURL().toString());
            
            return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=3600") // 1시간 캐시
                .body(html);
                
        } catch (Exception e) {
            log.error("테마 상세 SSR 처리 중 오류 발생: {}/{}", type, id, e);
            return generateFallbackHtml("테마 상세", request.getRequestURL().toString());
        }
    }
    
    /**
     * 카테고리 페이지 HTML 생성
     */
    private String generateCategoryHtml(String categoryName, String description, List<GameTheme> themes, String url) {
        StringBuilder themeList = new StringBuilder();
        
        // 테마 목록을 구조화된 데이터로 변환
        for (GameTheme theme : themes) {
            themeList.append(String.format("""
                <div class="theme-item">
                    <h3>%s</h3>
                    <p>%s</p>
                </div>
                """, 
                escapeHtml(theme.getTitle()),
                escapeHtml(theme.getSummary() != null ? theme.getSummary() : "")
            ));
        }
        
        return generateBaseHtml(
            categoryName + " - 미스터리 플레이스",
            categoryName,
            description,
            "https://mystery-place.com/content/image/default_crime_scene_image.webp",
            url,
            themeList.toString()
        );
    }
    
    /**
     * 테마 상세 페이지 HTML 생성
     */
    private String generateThemeDetailHtml(GameTheme theme, String url) {
        String content = String.format("""
            <div class="theme-detail">
                <h1>%s</h1>
                <p>%s</p>
                <div class="theme-info">
                    <p>장르: %s</p>
                    <p>타입: %s</p>
                </div>
            </div>
            """,
            escapeHtml(theme.getTitle()),
            escapeHtml(theme.getSummary() != null ? theme.getSummary() : ""),
            escapeHtml("테마"),
            escapeHtml(theme.getDiscriminator())
        );
        
        return generateBaseHtml(
            theme.getTitle() + " - 미스터리 플레이스",
            theme.getTitle(),
            theme.getSummary() != null ? theme.getSummary() : "미스터리 플레이스의 테마를 경험해보세요",
            theme.getThumbnail() != null ? theme.getThumbnail() : "https://mystery-place.com/content/image/default_image.webp",
            url,
            content
        );
    }
    
    /**
     * 기본 HTML 템플릿 생성
     */
    private String generateBaseHtml(String title, String ogTitle, String description, String image, String url, String content) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
                
                <!-- SEO 메타태그 -->
                <meta name="description" content="%s">
                <meta name="keywords" content="미스터리플레이스, 크라임씬, 방탈출, 추리게임, 테마">
                
                <!-- Open Graph -->
                <meta property="og:type" content="website">
                <meta property="og:site_name" content="미스터리 플레이스">
                <meta property="og:title" content="%s">
                <meta property="og:description" content="%s">
                <meta property="og:image" content="%s">
                <meta property="og:url" content="%s">
                
                <!-- Twitter Card -->
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="%s">
                <meta name="twitter:description" content="%s">
                <meta name="twitter:image" content="%s">
                
                <!-- 구조화된 데이터 -->
                <script type="application/ld+json">
                {
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "%s",
                    "description": "%s",
                    "url": "%s",
                    "publisher": {
                        "@type": "Organization",
                        "name": "미스터리 플레이스"
                    }
                }
                </script>
                
                <!-- 클라이언트로 리다이렉트 -->
                <script>
                    setTimeout(function() {
                        window.location.href = '%s';
                    }, 100);
                </script>
            </head>
            <body>
                <div style="display: none;">
                    %s
                </div>
                <div style="text-align: center; padding: 50px;">
                    <h1>%s</h1>
                    <p>페이지를 로딩중입니다...</p>
                    <p>자동으로 이동되지 않으면 <a href="%s">여기</a>를 클릭하세요.</p>
                </div>
            </body>
            </html>
            """,
            escapeHtml(title), escapeHtml(description),
            escapeHtml(ogTitle), escapeHtml(description), image, url,
            escapeHtml(ogTitle), escapeHtml(description), image,
            escapeHtml(title), escapeHtml(description), url,
            url.replace("/api/ssr", ""),
            content,
            escapeHtml(ogTitle),
            url.replace("/api/ssr", "")
        );
    }
    
    /**
     * 오류 발생 시 폴백 HTML
     */
    private ResponseEntity<String> generateFallbackHtml(String pageName, String url) {
        String html = generateBaseHtml(
            pageName + " - 미스터리 플레이스",
            pageName,
            "미스터리 플레이스에서 다양한 테마를 만나보세요",
            "https://mystery-place.com/content/image/default_image.webp",
            url,
            "<div><h1>" + escapeHtml(pageName) + "</h1></div>"
        );
        
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=300") // 5분 캐시
            .body(html);
    }
    
    /**
     * HTML 이스케이프 처리
     */
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#x27;");
    }
}