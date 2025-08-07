import { AudioToken, ParsedContent, ValidationResult, AudioMetadata } from './types/AudioTypes';

/**
 * 오디오 마크다운 문법 파서
 * 
 * 지원하는 문법:
 * 1. [audio:제목](URL) - 기본 마크다운 오디오 문법
 * 2. <audio>...</audio> - 기존 HTML 태그 (호환성)
 */
export class AudioSyntaxParser {
  // 마크다운 오디오 문법 정규식: [audio:제목](URL)
  private static readonly MARKDOWN_AUDIO_REGEX = /\[audio:([^\]]*)\]\(([^)]*)\)/g;
  
  // HTML audio 태그 정규식
  private static readonly HTML_AUDIO_REGEX = /<audio[^>]*src="([^"]*)"[^>]*(?:data-title="([^"]*)"[^>]*)?(?:data-temp-id="([^"]*)"[^>]*)?>(.*?)<\/audio>/gs;
  
  // 내부 오디오 스트림 URL 패턴
  private static readonly INTERNAL_AUDIO_PATTERN = /^\/api\/v1\/board\/audio\/stream\//;

  /**
   * 마크다운 컨텐츠에서 오디오 토큰을 파싱
   */
  parseContent(content: string): ParsedContent {
    // 입력 검증
    if (!content || typeof content !== 'string') {
      return {
        content: '',
        audioTokens: []
      };
    }

    const audioTokens: AudioToken[] = [];
    let processedContent = content;

    try {
      // 1. 기존 HTML audio 태그를 마크다운으로 변환
      processedContent = this.convertHtmlToMarkdown(processedContent, audioTokens);

      // 2. 마크다운 오디오 문법 파싱 (HTML 변환 후의 새로운 마크다운만)
      processedContent = this.parseMarkdownAudio(processedContent, audioTokens);

      // 3. 데이터 무결성 검증 및 정리
      const result = this.validateAndCleanTokens({
        content: processedContent,
        audioTokens
      });
      
      return result;
    } catch (error) {
      console.error('AudioSyntaxParser error:', error);
      return {
        content: content, // 오류 시 원본 반환
        audioTokens: []
      };
    }
  }

  /**
   * 토큰 데이터 검증 및 정리
   */
  private validateAndCleanTokens(parsedContent: ParsedContent): ParsedContent {
    const validTokens: AudioToken[] = [];
    const processedUrls = new Set<string>();

    for (const token of parsedContent.audioTokens) {
      // 필수 필드 검증
      if (!token.originalMatch || !token.url || !token.title) {
        console.warn('Invalid audio token detected:', token);
        continue;
      }

      // 중복 URL 제거 (같은 오디오에 대한 중복 토큰 방지)
      const urlKey = `${token.url}-${token.title}`;
      if (processedUrls.has(urlKey)) {
        console.debug('Duplicate audio token removed:', urlKey);
        continue;
      }

      processedUrls.add(urlKey);
      validTokens.push(token);
    }

    return {
      content: parsedContent.content,
      audioTokens: validTokens
    };
  }

  /**
   * HTML audio 태그를 마크다운 문법으로 변환
   */
  private convertHtmlToMarkdown(content: string, audioTokens: AudioToken[]): string {
    const result = content.replace(AudioSyntaxParser.HTML_AUDIO_REGEX, (match, src, dataTitle, tempId, innerText) => {
      const title = dataTitle || innerText?.trim() || this.extractTitleFromUrl(src) || 'Audio';
      const markdownSyntax = `[audio:${title}](${src})`;

      // 토큰 정보 저장 - originalMatch를 변환된 markdown으로 설정
      const token: AudioToken = {
        type: this.getUrlType(src),
        title,
        url: src,
        originalMatch: markdownSyntax, // HTML match 대신 변환된 markdown 사용
        position: [0, 0], // 위치는 나중에 계산
        tempId: tempId || undefined,
        metadata: {
          title,
          isPrivate: match.includes('data-private="true"')
        }
      };

      audioTokens.push(token);
      return markdownSyntax;
    });

    return result;
  }

  /**
   * 마크다운 오디오 문법 파싱
   */
  private parseMarkdownAudio(content: string, audioTokens: AudioToken[]): string {
    let processedContent = content;
    const matches = Array.from(content.matchAll(AudioSyntaxParser.MARKDOWN_AUDIO_REGEX));
    
    const existingUrls = new Set(audioTokens.map(token => `${token.url}-${token.title}`));

    for (const match of matches) {
      const [fullMatch, title, url] = match;
      const index = match.index || 0;

      // 데이터 검증
      if (!fullMatch || !url || url.trim().length === 0) {
        continue;
      }

      const trimmedTitle = (title || '').trim();
      const trimmedUrl = url.trim();
      const urlKey = `${trimmedUrl}-${trimmedTitle}`;

      // HTML에서 변환된 토큰이 있는지 확인하고 originalMatch 업데이트
      if (existingUrls.has(urlKey)) {
        // 기존 토큰의 originalMatch를 현재 markdown 형태로 업데이트
        const existingToken = audioTokens.find(t => `${t.url}-${t.title}` === urlKey);
        
        if (existingToken && existingToken.originalMatch !== fullMatch) {
          existingToken.originalMatch = fullMatch;
          existingToken.position = [index, index + fullMatch.length];
        }
        continue;
      }

      // 최종 제목 결정 (빈 제목 처리)
      const finalTitle = trimmedTitle || this.extractTitleFromUrl(trimmedUrl) || 'Audio';

      const token: AudioToken = {
        type: this.getUrlType(trimmedUrl),
        title: finalTitle,
        url: trimmedUrl,
        originalMatch: fullMatch,
        position: [index, index + fullMatch.length],
        metadata: {
          title: finalTitle
        }
      };

      audioTokens.push(token);
      existingUrls.add(urlKey);
    }

    return processedContent;
  }

  /**
   * URL 타입 판별 (internal/external)
   */
  private getUrlType(url: string): 'internal' | 'external' {
    return AudioSyntaxParser.INTERNAL_AUDIO_PATTERN.test(url) ? 'internal' : 'external';
  }

  /**
   * URL에서 제목 추출
   */
  private extractTitleFromUrl(url: string): string | null {
    try {
      const urlPath = new URL(url, window.location.origin).pathname;
      const filename = urlPath.split('/').pop();
      if (filename) {
        // 확장자 제거
        return filename.replace(/\.[^/.]+$/, '');
      }
    } catch {
      // URL 파싱 실패 시 마지막 슬래시 이후 텍스트 사용
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        return lastPart.replace(/\.[^/.]+$/, '');
      }
    }
    return null;
  }

  /**
   * 오디오 URL 유효성 검증
   */
  validateAudioUrl(url: string): ValidationResult {
    if (!url || url.trim().length === 0) {
      return {
        isValid: false,
        error: 'URL이 비어있습니다.'
      };
    }

    const trimmedUrl = url.trim();

    // 내부 오디오 URL 검증
    if (AudioSyntaxParser.INTERNAL_AUDIO_PATTERN.test(trimmedUrl)) {
      return {
        isValid: true,
        type: 'internal'
      };
    }

    // 외부 URL 검증
    try {
      const urlObj = new URL(trimmedUrl);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return {
          isValid: false,
          error: 'HTTP 또는 HTTPS URL만 지원됩니다.'
        };
      }

      return {
        isValid: true,
        type: 'external'
      };
    } catch {
      return {
        isValid: false,
        error: '유효하지 않은 URL 형식입니다.'
      };
    }
  }

  /**
   * 마크다운 오디오 문법 생성
   */
  static createMarkdownAudio(title: string, url: string): string {
    return `[audio:${title}](${url})`;
  }

  /**
   * HTML audio 태그에서 메타데이터 추출
   */
  extractHtmlAudioMetadata(htmlMatch: string): AudioMetadata {
    const metadata: AudioMetadata = {
      title: 'Audio'
    };

    // data-title 추출
    const titleMatch = htmlMatch.match(/data-title="([^"]*)"/);
    if (titleMatch) {
      metadata.title = titleMatch[1];
    }

    // data-private 추출
    const privateMatch = htmlMatch.match(/data-private="([^"]*)"/);
    if (privateMatch) {
      metadata.isPrivate = privateMatch[1] === 'true';
    }

    // 내부 텍스트에서 제목 추출 (fallback)
    const innerTextMatch = htmlMatch.match(/>([^<]+)<\/audio>/);
    if (innerTextMatch && !metadata.title) {
      metadata.title = innerTextMatch[1].trim();
    }

    return metadata;
  }
}