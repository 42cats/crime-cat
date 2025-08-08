import { apiClient } from '@/lib/api';

/**
 * 오디오 서비스 - 중복 API 호출 방지 및 캐싱
 */
export class AudioService {
  private static instance: AudioService;
  private audioCache = new Map<string, Promise<Blob>>();
  private blobUrlCache = new Map<string, string>();
  private readonly maxCacheSize = 30;
  private readonly cacheExpirationMs = 15 * 60 * 1000; // 15분
  private expirationTimers = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * 오디오 Blob 가져오기 (캐시 우선)
   */
  async getAudioBlob(url: string): Promise<Blob> {
    const cacheKey = this.generateCacheKey(url);

    // 이미 요청 중인 경우 같은 Promise 반환
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    // 새로운 요청 생성 및 캐시 저장
    const audioPromise = this.fetchAudioBlob(url);
    this.audioCache.set(cacheKey, audioPromise);

    // 캐시 크기 제한
    this.enforceMaxCacheSize();

    // 캐시 만료 타이머 설정
    this.setCacheExpiration(cacheKey);

    try {
      const blob = await audioPromise;
      return blob;
    } catch (error) {
      // 실패한 요청은 캐시에서 제거
      this.audioCache.delete(cacheKey);
      this.clearCacheExpiration(cacheKey);
      throw error;
    }
  }

  /**
   * 오디오 Blob URL 가져오기 (재사용 가능한 URL)
   */
  async getAudioBlobUrl(url: string): Promise<string> {
    const cacheKey = this.generateCacheKey(url);

    // 이미 생성된 Blob URL이 있는 경우 재사용
    if (this.blobUrlCache.has(cacheKey)) {
      return this.blobUrlCache.get(cacheKey)!;
    }

    try {
      const blob = await this.getAudioBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      
      // Blob URL 캐시 저장
      this.blobUrlCache.set(cacheKey, blobUrl);
      
      return blobUrl;
    } catch (error) {
      console.error('Failed to create audio blob URL:', error);
      throw new Error(`오디오를 로드할 수 없습니다: ${url}`);
    }
  }

  /**
   * URL 정규화 - baseURL 중복 제거
   */
  private normalizeUrl(url: string): string {
    // "/api/v1/"로 시작하면 제거 (axios baseURL에서 자동 추가되므로)
    if (url.startsWith('/api/v1/')) {
      return url.substring(7); // "/api/v1/" 제거하여 상대 경로로 변환
    }
    return url;
  }

  /**
   * 실제 API 호출
   */
  private async fetchAudioBlob(url: string): Promise<Blob> {
    try {
      console.log('🔍 AudioService.fetchAudioBlob() - Input URL:', url);
      
      // URL 정규화: baseURL 중복 방지
      const normalizedUrl = this.normalizeUrl(url);
      console.log('🔄 Normalized URL:', normalizedUrl);
      
      console.log('📡 Making API request to:', normalizedUrl);
      const response = await apiClient.get<Blob>(normalizedUrl, { 
        responseType: 'blob',
        timeout: 30000, // 30초 타임아웃
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'audio/*,*/*'
        }
      });
      
      console.log('✅ Audio fetch successful for:', normalizedUrl);
      return response;
    } catch (error) {
      console.error('❌ Audio fetch failed for URL:', url, error);
      throw new Error(`오디오 다운로드 실패: ${url}`);
    }
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(url: string): string {
    return `audio_${btoa(encodeURIComponent(url)).substring(0, 16)}`;
  }

  /**
   * 캐시 크기 제한 강제
   */
  private enforceMaxCacheSize(): void {
    if (this.audioCache.size <= this.maxCacheSize) return;

    // 가장 오래된 항목들 제거
    const keysToRemove = Array.from(this.audioCache.keys()).slice(0, 5);
    keysToRemove.forEach(key => {
      this.removeFromCache(key);
    });
  }

  /**
   * 캐시 만료 설정
   */
  private setCacheExpiration(cacheKey: string): void {
    // 기존 타이머 정리
    this.clearCacheExpiration(cacheKey);

    // 새 타이머 설정
    const timer = setTimeout(() => {
      this.removeFromCache(cacheKey);
    }, this.cacheExpirationMs);

    this.expirationTimers.set(cacheKey, timer);
  }

  /**
   * 캐시 만료 타이머 정리
   */
  private clearCacheExpiration(cacheKey: string): void {
    const timer = this.expirationTimers.get(cacheKey);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(cacheKey);
    }
  }

  /**
   * 캐시에서 항목 제거
   */
  private removeFromCache(cacheKey: string): void {
    // Blob URL 정리
    const blobUrl = this.blobUrlCache.get(cacheKey);
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }

    // 캐시에서 제거
    this.audioCache.delete(cacheKey);
    this.blobUrlCache.delete(cacheKey);
    this.clearCacheExpiration(cacheKey);
  }

  /**
   * 특정 URL 캐시 무효화
   */
  invalidateCache(url: string): void {
    const cacheKey = this.generateCacheKey(url);
    this.removeFromCache(cacheKey);
  }

  /**
   * 전체 캐시 정리
   */
  clearCache(): void {
    // 모든 Blob URL 정리
    for (const blobUrl of this.blobUrlCache.values()) {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    }

    // 모든 타이머 정리
    for (const timer of this.expirationTimers.values()) {
      clearTimeout(timer);
    }

    // 캐시 정리
    this.audioCache.clear();
    this.blobUrlCache.clear();
    this.expirationTimers.clear();
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      audioCacheSize: this.audioCache.size,
      blobUrlCacheSize: this.blobUrlCache.size,
      activeTimers: this.expirationTimers.size,
      maxCacheSize: this.maxCacheSize,
      cacheExpirationMs: this.cacheExpirationMs
    };
  }

  /**
   * 프리로드 (선택적)
   */
  async preloadAudio(urls: string[]): Promise<void> {
    const preloadPromises = urls.map(url => 
      this.getAudioBlob(url).catch(error => 
        console.warn(`Preload failed for ${url}:`, error)
      )
    );

    await Promise.allSettled(preloadPromises);
  }
}

// 싱글톤 인스턴스 내보내기
export const audioService = AudioService.getInstance();