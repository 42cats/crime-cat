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
    console.log('🎵 AudioSyntaxParser.parseContent() START');
    console.log('📥 Original content:', JSON.stringify(content));
    console.log('📏 Content length:', content?.length);
    
    // 입력 검증
    if (!content || typeof content !== 'string') {
      console.log('❌ Invalid content input');
      return {
        content: '',
        audioTokens: []
      };
    }

    const audioTokens: AudioToken[] = [];
    let processedContent = content;

    try {
      console.log('🔄 Step 1: HTML to Markdown conversion');
      // 1. 기존 HTML audio 태그를 마크다운으로 변환
      processedContent = this.convertHtmlToMarkdown(processedContent, audioTokens);
      console.log('📤 After HTML conversion:', JSON.stringify(processedContent));
      console.log('🎯 Tokens after HTML conversion:', audioTokens.length, audioTokens);

      console.log('🔄 Step 2: Markdown audio parsing');
      // 2. 마크다운 오디오 문법 파싱 (HTML 변환 후의 새로운 마크다운만)
      processedContent = this.parseMarkdownAudio(processedContent, audioTokens);
      console.log('📤 After Markdown parsing:', JSON.stringify(processedContent));
      console.log('🎯 Final tokens:', audioTokens.length, audioTokens);

      console.log('🔄 Step 3: Validation and cleanup');
      // 3. 데이터 무결성 검증 및 정리
      const result = this.validateAndCleanTokens({
        content: processedContent,
        audioTokens
      });
      
      console.log('✅ AudioSyntaxParser.parseContent() COMPLETE');
      console.log('📊 Final result detailed:');
      console.log('  - result object:', result);
      console.log('  - result.content:', JSON.stringify(result.content));
      console.log('  - result.audioTokens:', result.audioTokens);
      console.log('  - typeof result.content:', typeof result.content);
      console.log('  - result.content === undefined:', result.content === undefined);
      console.log('  - Object.keys(result):', Object.keys(result));
      
      return result;
    } catch (error) {
      console.error('💥 AudioSyntaxParser error:', error);
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
    console.log('🏷️  convertHtmlToMarkdown() START');
    console.log('📥 HTML conversion input:', JSON.stringify(content));
    
    const result = content.replace(AudioSyntaxParser.HTML_AUDIO_REGEX, (match, src, dataTitle, tempId, innerText) => {
      console.log('🎯 HTML regex match found:');
      console.log('  - match:', JSON.stringify(match));
      console.log('  - src:', JSON.stringify(src));
      console.log('  - dataTitle:', JSON.stringify(dataTitle));
      console.log('  - innerText:', JSON.stringify(innerText));
      
      const title = dataTitle || innerText?.trim() || this.extractTitleFromUrl(src) || 'Audio';
      const markdownSyntax = `[audio:${title}](${src})`;
      console.log('🔄 Converted to markdown:', JSON.stringify(markdownSyntax));

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

      console.log('✨ Created HTML-converted token:', token);
      audioTokens.push(token);
      return markdownSyntax;
    });

    console.log('📤 HTML conversion result:', JSON.stringify(result));
    console.log('🎯 Tokens created from HTML:', audioTokens.length);
    return result;
  }

  /**
   * 마크다운 오디오 문법 파싱
   */
  private parseMarkdownAudio(content: string, audioTokens: AudioToken[]): string {
    console.log('📝 parseMarkdownAudio() START');
    console.log('📥 Markdown parsing input:', JSON.stringify(content));
    console.log('📦 Existing tokens:', audioTokens.length, audioTokens);
    
    let processedContent = content;
    const matches = Array.from(content.matchAll(AudioSyntaxParser.MARKDOWN_AUDIO_REGEX));
    console.log('🔍 Regex matches found:', matches.length);
    
    if (matches.length > 0) {
      console.log('🎯 Detailed matches:');
      matches.forEach((match, i) => {
        console.log(`  Match ${i}:`, {
          fullMatch: JSON.stringify(match[0]),
          title: JSON.stringify(match[1]),
          url: JSON.stringify(match[2]),
          index: match.index
        });
      });
    }
    
    const existingUrls = new Set(audioTokens.map(token => `${token.url}-${token.title}`));
    console.log('🗂️  Existing URL keys:', Array.from(existingUrls));

    for (const match of matches) {
      const [fullMatch, title, url] = match;
      const index = match.index || 0;

      console.log(`\n🔄 Processing match: ${JSON.stringify(fullMatch)}`);

      // 데이터 검증
      if (!fullMatch || !url || url.trim().length === 0) {
        console.warn('❌ Invalid markdown audio syntax detected:', fullMatch);
        continue;
      }

      const trimmedTitle = (title || '').trim();
      const trimmedUrl = url.trim();
      const urlKey = `${trimmedUrl}-${trimmedTitle}`;
      
      console.log('🔑 Generated URL key:', JSON.stringify(urlKey));
      console.log('🔍 Checking if exists in:', Array.from(existingUrls));
      console.log('✅ URL key exists:', existingUrls.has(urlKey));

      // HTML에서 변환된 토큰이 있는지 확인하고 originalMatch 업데이트
      if (existingUrls.has(urlKey)) {
        console.log('🔄 Found existing token, updating originalMatch');
        // 기존 토큰의 originalMatch를 현재 markdown 형태로 업데이트
        const existingToken = audioTokens.find(t => `${t.url}-${t.title}` === urlKey);
        console.log('🎯 Found existing token:', existingToken);
        
        if (existingToken) {
          if (existingToken.originalMatch !== fullMatch) {
            console.log('📝 Updating originalMatch:');
            console.log('  - OLD:', JSON.stringify(existingToken.originalMatch));
            console.log('  - NEW:', JSON.stringify(fullMatch));
            existingToken.originalMatch = fullMatch;
            existingToken.position = [index, index + fullMatch.length];
            console.log('✅ Updated token:', existingToken);
          } else {
            console.log('ℹ️  originalMatch already matches, no update needed');
          }
        } else {
          console.error('❌ Could not find existing token despite URL key match!');
        }
        continue;
      }

      // 최종 제목 결정 (빈 제목 처리)
      const finalTitle = trimmedTitle || this.extractTitleFromUrl(trimmedUrl) || 'Audio';
      console.log('📝 Final title determined:', JSON.stringify(finalTitle));

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

      console.log('✨ Creating new markdown token:', token);
      audioTokens.push(token);
      existingUrls.add(urlKey);
    }

    console.log('📤 Markdown parsing complete. Final tokens:', audioTokens.length);
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