import { AudioToken, ResolvedAudio, AudioMetadata } from './types/AudioTypes';
import { apiClient } from '@/lib/api';

/**
 * 오디오 리졸버 - 오디오 URL을 실제 재생 가능한 형태로 변환
 */
export class AudioResolver {
  private cache = new Map<string, ResolvedAudio>();
  private readonly maxCacheSize = 50;
  private readonly cacheExpirationMs = 10 * 60 * 1000; // 10분

  /**
   * 오디오 토큰을 해결하여 재생 가능한 형태로 변환
   */
  async resolveAudio(token: AudioToken): Promise<ResolvedAudio> {
    const cacheKey = this.generateCacheKey(token);
    
    // 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    let resolved: ResolvedAudio;

    try {
      if (token.type === 'internal') {
        resolved = await this.resolveInternalAudio(token);
      } else {
        resolved = await this.resolveExternalAudio(token);
      }

      // 캐시에 저장
      this.setCache(cacheKey, resolved);
      return resolved;
    } catch (error) {
      console.error('Audio resolution failed:', error);
      throw new Error(`오디오를 로드할 수 없습니다: ${token.title}`);
    }
  }

  /**
   * 내부 오디오 스트림 해결
   */
  private async resolveInternalAudio(token: AudioToken): Promise<ResolvedAudio> {
    try {
      // apiClient를 사용하여 인증된 요청으로 오디오 데이터 가져오기
      const audioBlob = await apiClient.get<Blob>(token.url, { 
        responseType: 'blob' 
      });

      const blobUrl = URL.createObjectURL(audioBlob);
      const metadata = await this.extractBlobMetadata(audioBlob, token);

      return {
        blobUrl,
        metadata: {
          ...token.metadata,
          ...metadata
        },
        cacheKey: this.generateCacheKey(token),
        expiresAt: new Date(Date.now() + this.cacheExpirationMs)
      };
    } catch (error) {
      console.error('Internal audio resolution failed:', error);
      throw error;
    }
  }

  /**
   * 외부 오디오 URL 해결
   */
  private async resolveExternalAudio(token: AudioToken): Promise<ResolvedAudio> {
    try {
      // 외부 URL은 CORS 문제로 인해 직접 접근 시도
      const response = await fetch(token.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const blobUrl = URL.createObjectURL(audioBlob);
      const metadata = await this.extractBlobMetadata(audioBlob, token);

      return {
        blobUrl,
        metadata: {
          ...token.metadata,
          ...metadata
        },
        cacheKey: this.generateCacheKey(token),
        expiresAt: new Date(Date.now() + this.cacheExpirationMs)
      };
    } catch (error) {
      console.error('External audio resolution failed:', error);
      
      // 외부 URL 실패 시 직접 URL 사용 (fallback)
      return {
        blobUrl: token.url,
        metadata: {
          title: token.title,
          ...token.metadata
        },
        cacheKey: this.generateCacheKey(token),
        expiresAt: new Date(Date.now() + this.cacheExpirationMs)
      };
    }
  }

  /**
   * Blob에서 오디오 메타데이터 추출
   */
  private async extractBlobMetadata(blob: Blob, token: AudioToken): Promise<Partial<AudioMetadata>> {
    const metadata: Partial<AudioMetadata> = {
      fileSize: blob.size,
      contentType: blob.type
    };

    // 오디오 duration 추출을 위한 임시 audio element 생성
    try {
      const tempAudio = document.createElement('audio');
      const tempUrl = URL.createObjectURL(blob);
      
      return new Promise<Partial<AudioMetadata>>((resolve) => {
        const cleanup = () => {
          URL.revokeObjectURL(tempUrl);
          tempAudio.remove();
        };

        tempAudio.onloadedmetadata = () => {
          metadata.duration = tempAudio.duration;
          cleanup();
          resolve(metadata);
        };

        tempAudio.onerror = () => {
          cleanup();
          resolve(metadata); // duration 없이 반환
        };

        // 5초 타임아웃
        setTimeout(() => {
          cleanup();
          resolve(metadata);
        }, 5000);

        tempAudio.src = tempUrl;
      });
    } catch (error) {
      console.warn('Metadata extraction failed:', error);
      return metadata;
    }
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(token: AudioToken): string {
    return `audio_${token.type}_${btoa(token.url).substring(0, 16)}`;
  }

  /**
   * 캐시에서 가져오기
   */
  private getFromCache(cacheKey: string): ResolvedAudio | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    // 만료 확인
    if (Date.now() > cached.expiresAt.getTime()) {
      this.cache.delete(cacheKey);
      // Blob URL 정리
      if (cached.blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cached.blobUrl);
      }
      return null;
    }

    return cached;
  }

  /**
   * 캐시에 저장
   */
  private setCache(cacheKey: string, resolved: ResolvedAudio): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      const firstValue = this.cache.get(firstKey);
      if (firstValue && firstValue.blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(firstValue.blobUrl);
      }
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, resolved);
  }

  /**
   * 캐시 정리
   */
  cleanup(): void {
    for (const [key, resolved] of this.cache.entries()) {
      if (resolved.blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(resolved.blobUrl);
      }
    }
    this.cache.clear();
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let totalSize = 0;

    for (const [key, resolved] of this.cache.entries()) {
      if (now <= resolved.expiresAt.getTime()) {
        validEntries++;
        totalSize += resolved.metadata.fileSize || 0;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      totalSize,
      maxSize: this.maxCacheSize
    };
  }
}