import { AudioToken, ResolvedAudio, AudioMetadata } from './types/AudioTypes';
import { audioService } from '@/services/AudioService';

/**
 * 오디오 리졸버 - 오디오 URL을 실제 재생 가능한 형태로 변환
 * AudioService를 통한 중복 요청 방지 및 캐싱
 */
export class AudioResolver {
  private metadataCache = new Map<string, AudioMetadata>();
  private readonly cacheExpirationMs = 10 * 60 * 1000; // 10분

  /**
   * 오디오 토큰을 해결하여 재생 가능한 형태로 변환
   */
  async resolveAudio(token: AudioToken): Promise<ResolvedAudio> {
    try {
      let blobUrl: string;
      let metadata: AudioMetadata;

      if (token.type === 'internal') {
        const result = await this.resolveInternalAudio(token);
        blobUrl = result.blobUrl;
        metadata = result.metadata;
      } else {
        const result = await this.resolveExternalAudio(token);
        blobUrl = result.blobUrl;
        metadata = result.metadata;
      }

      return {
        blobUrl,
        metadata,
        cacheKey: this.generateCacheKey(token),
        expiresAt: new Date(Date.now() + this.cacheExpirationMs)
      };
    } catch (error) {
      console.error('Audio resolution failed:', error);
      throw new Error(`오디오를 로드할 수 없습니다: ${token.title}`);
    }
  }

  /**
   * 내부 오디오 스트림 해결 (AudioService 사용)
   */
  private async resolveInternalAudio(token: AudioToken): Promise<{ blobUrl: string; metadata: AudioMetadata }> {
    try {
      console.log('🎯 AudioResolver.resolveInternalAudio() - Processing token:', token);
      console.log('  - token.url:', token.url);
      console.log('  - token.type:', token.type);
      
      // AudioService를 통해 중복 요청 방지
      console.log('🔄 Calling audioService.getAudioBlobUrl()...');
      const blobUrl = await audioService.getAudioBlobUrl(token.url);
      console.log('✅ Received blobUrl from AudioService:', blobUrl);
      
      // 메타데이터는 한번만 추출하고 캐시
      let metadata = this.getMetadataFromCache(token.url);
      if (!metadata) {
        console.log('🔄 Extracting metadata from blob...');
        const audioBlob = await audioService.getAudioBlob(token.url);
        const partialMetadata = await this.extractBlobMetadata(audioBlob, token);
        metadata = {
          title: token.title, // 기본 제목 사용
          ...partialMetadata
        };
        this.setMetadataCache(token.url, metadata);
        console.log('✅ Extracted and cached metadata:', metadata);
      } else {
        console.log('📦 Using cached metadata:', metadata);
      }

      const result = {
        blobUrl,
        metadata: {
          ...token.metadata,
          ...metadata
        }
      };
      
      console.log('📤 AudioResolver.resolveInternalAudio() RESULT:', result);
      return result;
    } catch (error) {
      console.error('💥 Internal audio resolution failed:', error);
      throw error;
    }
  }

  /**
   * 외부 오디오 URL 해결
   */
  private async resolveExternalAudio(token: AudioToken): Promise<{ blobUrl: string; metadata: AudioMetadata }> {
    try {
      // 외부 URL은 CORS 문제로 인해 직접 fetch 사용
      let metadata = this.getMetadataFromCache(token.url);
      if (!metadata) {
        const response = await fetch(token.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const audioBlob = await response.blob();
        const partialMetadata = await this.extractBlobMetadata(audioBlob, token);
        metadata = {
          title: token.title, // 기본 제목 사용
          ...partialMetadata
        };
        this.setMetadataCache(token.url, metadata);
      }

      // 외부 URL은 직접 사용 (CORS 허용된 경우)
      return {
        blobUrl: token.url,
        metadata: {
          ...token.metadata,
          ...metadata
        }
      };
    } catch (error) {
      console.error('External audio resolution failed:', error);
      
      // 외부 URL 실패 시 직접 URL 사용 (fallback)
      return {
        blobUrl: token.url,
        metadata: {
          title: token.title,
          ...token.metadata
        }
      };
    }
  }

  /**
   * Blob에서 오디오 메타데이터 추출
   */
  private async extractBlobMetadata(blob: Blob, _token: AudioToken): Promise<Partial<AudioMetadata>> {
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
   * 메타데이터 캐시에서 가져오기
   */
  private getMetadataFromCache(url: string): AudioMetadata | null {
    return this.metadataCache.get(url) || null;
  }

  /**
   * 메타데이터 캐시에 저장
   */
  private setMetadataCache(url: string, metadata: AudioMetadata): void {
    this.metadataCache.set(url, metadata);
  }

  /**
   * 캐시 정리 - AudioService에 위임
   */
  cleanup(): void {
    this.metadataCache.clear();
    // AudioService 캐시는 자체적으로 관리됨
  }

  /**
   * 캐시 통계 - AudioService와 메타데이터 캐시 통합
   */
  getCacheStats() {
    const audioServiceStats = audioService.getCacheStats();
    
    return {
      audioService: audioServiceStats,
      metadataCache: {
        entries: this.metadataCache.size
      },
      total: {
        entries: audioServiceStats.audioCacheSize + this.metadataCache.size
      }
    };
  }
}