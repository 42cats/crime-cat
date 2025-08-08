import { apiClient } from '@/lib/api';

/**
 * Blob URL 메타데이터 인터페이스
 */
interface BlobDescriptor {
  blobUrl: string;
  fileHash: string;
  originalUrl: string;
  createdAt: number;
  lastUsedAt: number;
  refCount: number;
  fileSize?: number;
}

/**
 * 메모리 사용량 추적 인터페이스
 */
interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * 메모리 최적화 오디오 서비스 - 글로벌 단일 인스턴스 캐싱
 */
export class AudioService {
  private static instance: AudioService;
  
  // HTTP 응답 캐시 (Blob Promise)
  private httpCache = new Map<string, Promise<Blob>>();
  
  // 글로벌 Blob URL 캐시 (파일 해시별 단일 인스턴스)
  private globalBlobCache = new Map<string, BlobDescriptor>();
  
  // 참조 카운팅 (컴포넌트별 사용 추적)
  private referenceCounter = new Map<string, Set<string>>();
  
  // 메모리 관리 설정
  private readonly maxCacheSize = 15; // 메모리 절약을 위해 감소
  private readonly maxMemoryUsageRatio = 0.8; // 80% 이상 시 정리
  private readonly emergencyCleanupThreshold = 0.9; // 90% 이상 시 긴급 정리
  
  // 메모리 모니터링
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMemoryMonitoring();
    console.log('🚀 MemoryOptimizedAudioService initialized');
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * 메모리 모니터링 시작
   */
  private startMemoryMonitoring(): void {
    // 30초마다 메모리 상태 확인
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }

  /**
   * 파일 URL에서 해시 생성 (간단한 해시 함수)
   */
  private generateFileHash(url: string): string {
    // URL에서 파일 경로 추출하여 해시로 사용
    const normalizedUrl = this.normalizeUrl(url);
    return `hash_${btoa(normalizedUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
  }

  /**
   * 컴포넌트 ID 생성 (참조 카운팅용)
   */
  private generateComponentId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 오디오 Blob 가져오기 (HTTP 캐시 우선)
   */
  private async getAudioBlob(url: string): Promise<Blob> {
    const normalizedUrl = this.normalizeUrl(url);

    // 이미 요청 중인 경우 같은 Promise 반환
    if (this.httpCache.has(normalizedUrl)) {
      console.log('🔄 AudioService - Reusing HTTP cache for:', normalizedUrl);
      return this.httpCache.get(normalizedUrl)!;
    }

    // 새로운 요청 생성 및 캐시 저장
    const audioPromise = this.fetchAudioBlob(normalizedUrl);
    this.httpCache.set(normalizedUrl, audioPromise);

    // HTTP 캐시 크기 제한
    this.enforceHttpCacheSize();

    try {
      const blob = await audioPromise;
      console.log('✅ AudioService - HTTP fetch completed for:', normalizedUrl);
      return blob;
    } catch (error) {
      // 실패한 요청은 캐시에서 제거
      this.httpCache.delete(normalizedUrl);
      throw error;
    }
  }

  /**
   * 오디오 Blob URL 가져오기 (글로벌 단일 인스턴스 + 참조 카운팅)
   */
  async getAudioBlobUrl(url: string, componentId?: string): Promise<{ blobUrl: string; componentId: string }> {
    const fileHash = this.generateFileHash(url);
    const compId = componentId || this.generateComponentId();

    console.log('🎵 AudioService - Requesting blob URL:', {
      originalUrl: url,
      fileHash,
      componentId: compId
    });

    // 기존 글로벌 Blob URL이 있는 경우 재사용
    if (this.globalBlobCache.has(fileHash)) {
      const descriptor = this.globalBlobCache.get(fileHash)!;
      
      // 참조 카운터 증가
      this.addReference(fileHash, compId);
      
      // 마지막 사용 시간 업데이트
      descriptor.lastUsedAt = Date.now();
      
      console.log('♻️ AudioService - Reusing existing blob URL:', {
        blobUrl: descriptor.blobUrl,
        refCount: descriptor.refCount,
        componentId: compId
      });
      
      return { blobUrl: descriptor.blobUrl, componentId: compId };
    }

    try {
      // 새로운 Blob URL 생성
      const blob = await this.getAudioBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const now = Date.now();
      
      // 글로벌 캐시에 저장
      const descriptor: BlobDescriptor = {
        blobUrl,
        fileHash,
        originalUrl: url,
        createdAt: now,
        lastUsedAt: now,
        refCount: 0,
        fileSize: blob.size
      };
      
      this.globalBlobCache.set(fileHash, descriptor);
      
      // 참조 카운터 증가
      this.addReference(fileHash, compId);
      
      // 캐시 크기 제한 적용
      this.enforceGlobalCacheSize();
      
      console.log('🎵 AudioService - Created new global blob URL:', {
        originalUrl: url,
        blobUrl,
        fileSize: blob.size,
        componentId: compId,
        totalGlobalBlobs: this.globalBlobCache.size
      });
      
      return { blobUrl, componentId: compId };
    } catch (error) {
      console.error('Failed to create audio blob URL:', error);
      throw new Error(`오디오를 로드할 수 없습니다: ${url}`);
    }
  }

  /**
   * 참조 추가 (컴포넌트가 Blob URL 사용 시작)
   */
  private addReference(fileHash: string, componentId: string): void {
    const descriptor = this.globalBlobCache.get(fileHash);
    if (!descriptor) return;

    // 참조 카운터에 컴포넌트 추가
    if (!this.referenceCounter.has(fileHash)) {
      this.referenceCounter.set(fileHash, new Set());
    }
    
    this.referenceCounter.get(fileHash)!.add(componentId);
    descriptor.refCount = this.referenceCounter.get(fileHash)!.size;
    
    console.log('➕ AudioService - Added reference:', {
      fileHash,
      componentId,
      refCount: descriptor.refCount
    });
  }

  /**
   * 참조 제거 (컴포넌트 언마운트 시)
   */
  releaseReference(componentId: string): void {
    let releasedFiles: string[] = [];

    for (const [fileHash, components] of this.referenceCounter.entries()) {
      if (components.has(componentId)) {
        components.delete(componentId);
        
        const descriptor = this.globalBlobCache.get(fileHash);
        if (descriptor) {
          descriptor.refCount = components.size;
          
          console.log('➖ AudioService - Removed reference:', {
            fileHash,
            componentId,
            refCount: descriptor.refCount
          });

          // 참조 카운트가 0이면 즉시 메모리 해제
          if (descriptor.refCount === 0) {
            this.immediateCleanup(fileHash);
            releasedFiles.push(fileHash);
          }
        }
      }
    }

    if (releasedFiles.length > 0) {
      console.log('🧹 AudioService - Zero-latency cleanup completed:', {
        componentId,
        releasedFiles,
        remainingGlobalBlobs: this.globalBlobCache.size
      });
    }
  }

  /**
   * 즉시 메모리 해제 (참조 카운트 0인 경우)
   */
  private immediateCleanup(fileHash: string): void {
    const descriptor = this.globalBlobCache.get(fileHash);
    if (!descriptor) return;

    console.log('🧹 AudioService - Immediate cleanup:', {
      fileHash,
      blobUrl: descriptor.blobUrl,
      fileSize: descriptor.fileSize
    });

    // Blob URL 해제
    URL.revokeObjectURL(descriptor.blobUrl);
    
    // 캐시에서 제거
    this.globalBlobCache.delete(fileHash);
    this.referenceCounter.delete(fileHash);
    
    // 강제 가비지 컬렉션 힌트 (Chrome DevTools)
    this.triggerGarbageCollection();
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
      console.log('📡 AudioService - Making HTTP request to:', url);
      
      const response = await apiClient.get<Blob>(url, { 
        responseType: 'blob',
        timeout: 30000, // 30초 타임아웃
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'audio/*,*/*'
        }
      });
      
      console.log('✅ AudioService - HTTP request successful:', {
        url,
        size: response.size
      });
      
      return response;
    } catch (error) {
      console.error('❌ AudioService - HTTP request failed:', url, error);
      throw new Error(`오디오 다운로드 실패: ${url}`);
    }
  }

  /**
   * 강제 가비지 컬렉션 트리거 (Chrome DevTools 전용)
   */
  private triggerGarbageCollection(): void {
    try {
      if (typeof window !== 'undefined' && (window as any).gc) {
        setTimeout(() => {
          (window as any).gc();
          console.log('🗑️ AudioService - Forced garbage collection triggered');
        }, 100);
      }
    } catch (error) {
      // 가비지 컬렉션이 사용 불가능한 환경에서는 무시
      console.debug('GC not available:', error);
    }
  }

  /**
   * HTTP 캐시 크기 제한
   */
  private enforceHttpCacheSize(): void {
    if (this.httpCache.size <= this.maxCacheSize) return;

    // 가장 오래된 항목들 제거 (LRU 방식)
    const keysToRemove = Array.from(this.httpCache.keys()).slice(0, 5);
    keysToRemove.forEach(key => {
      this.httpCache.delete(key);
      console.log('🧹 AudioService - Removed old HTTP cache:', key);
    });
  }

  /**
   * 글로벌 캐시 크기 제한
   */
  private enforceGlobalCacheSize(): void {
    if (this.globalBlobCache.size <= this.maxCacheSize) return;

    console.log('⚠️ AudioService - Global cache size limit reached, cleaning up oldest entries');

    // 마지막 사용 시간 기준으로 정렬하여 가장 오래된 것부터 제거
    const sortedEntries = Array.from(this.globalBlobCache.entries())
      .sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt)
      .slice(0, 5); // 가장 오래된 5개 제거

    for (const [fileHash, descriptor] of sortedEntries) {
      if (descriptor.refCount === 0) {
        this.immediateCleanup(fileHash);
        console.log('🧹 AudioService - Removed unused old entry:', fileHash);
      }
    }
  }

  /**
   * 메모리 사용량 확인
   */
  private checkMemoryUsage(): void {
    try {
      const memoryInfo = this.getMemoryStats();
      if (!memoryInfo) return;

      const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
      
      console.log('📊 AudioService - Memory usage check:', {
        usageRatio: (usageRatio * 100).toFixed(1) + '%',
        usedMB: (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1),
        totalMB: (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1),
        globalBlobsCount: this.globalBlobCache.size,
        httpCacheCount: this.httpCache.size
      });

      // 긴급 정리 필요
      if (usageRatio > this.emergencyCleanupThreshold) {
        console.warn('🚨 AudioService - Emergency memory cleanup triggered');
        this.emergencyCleanup();
      }
      // 일반 정리 필요
      else if (usageRatio > this.maxMemoryUsageRatio) {
        console.warn('⚠️ AudioService - Memory cleanup triggered');
        this.performMemoryCleanup();
      }
    } catch (error) {
      console.warn('Memory monitoring failed:', error);
    }
  }

  /**
   * 메모리 통계 가져오기
   */
  private getMemoryStats(): MemoryStats | null {
    try {
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }
    } catch (error) {
      console.debug('Memory API not available:', error);
    }
    return null;
  }

  /**
   * 일반 메모리 정리
   */
  private performMemoryCleanup(): void {
    let cleanedCount = 0;

    // 참조 카운트가 0인 항목들 정리
    for (const [fileHash, descriptor] of this.globalBlobCache.entries()) {
      if (descriptor.refCount === 0) {
        this.immediateCleanup(fileHash);
        cleanedCount++;
      }
    }

    // HTTP 캐시 정리
    this.httpCache.clear();

    this.triggerGarbageCollection();

    console.log('🧹 AudioService - Memory cleanup completed:', {
      cleanedBlobs: cleanedCount,
      remainingGlobalBlobs: this.globalBlobCache.size
    });
  }

  /**
   * 긴급 메모리 정리 (모든 캐시 정리)
   */
  private emergencyCleanup(): void {
    console.log('🚨 AudioService - Emergency cleanup started');

    let totalCleaned = 0;

    // 모든 글로벌 Blob URL 해제
    for (const [fileHash, descriptor] of this.globalBlobCache.entries()) {
      URL.revokeObjectURL(descriptor.blobUrl);
      totalCleaned++;
    }

    // 모든 캐시 초기화
    this.globalBlobCache.clear();
    this.referenceCounter.clear();
    this.httpCache.clear();

    this.triggerGarbageCollection();

    console.log('🚨 AudioService - Emergency cleanup completed:', {
      totalCleanedBlobs: totalCleaned
    });
  }

  /**
   * 레거시 호환성을 위한 URL 캐시 무효화 (더 이상 사용되지 않음)
   */
  invalidateCache(url: string): void {
    const fileHash = this.generateFileHash(url);
    const descriptor = this.globalBlobCache.get(fileHash);
    
    if (descriptor && descriptor.refCount === 0) {
      this.immediateCleanup(fileHash);
      console.log('🧹 AudioService - Invalidated cache for:', url);
    } else if (descriptor) {
      console.log('ℹ️ AudioService - Cannot invalidate cache (still referenced):', {
        url,
        refCount: descriptor.refCount
      });
    }
  }

  /**
   * 전체 캐시 정리 (레거시 호환성)
   */
  clearCache(): void {
    console.log('🧹 AudioService - Clearing all cache');
    this.emergencyCleanup();
  }

  /**
   * 서비스 종료 시 정리
   */
  destroy(): void {
    console.log('🔧 AudioService - Destroying service');
    
    // 메모리 모니터링 중지
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // 모든 캐시 정리
    this.emergencyCleanup();
  }

  /**
   * 캐시 통계 (메모리 사용량 포함)
   */
  getCacheStats() {
    const memoryStats = this.getMemoryStats();
    
    // 총 메모리 사용량 계산 (추정)
    let totalBlobSize = 0;
    for (const descriptor of this.globalBlobCache.values()) {
      totalBlobSize += descriptor.fileSize || 0;
    }

    return {
      // 새로운 메트릭
      globalBlobsCount: this.globalBlobCache.size,
      httpCacheCount: this.httpCache.size,
      totalReferences: Array.from(this.referenceCounter.values()).reduce((sum, set) => sum + set.size, 0),
      totalBlobSizeMB: (totalBlobSize / 1024 / 1024).toFixed(2),
      
      // 메모리 정보
      memoryUsageRatio: memoryStats ? (memoryStats.usedJSHeapSize / memoryStats.totalJSHeapSize * 100).toFixed(1) + '%' : 'N/A',
      memoryUsedMB: memoryStats ? (memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(1) : 'N/A',
      
      // 설정
      maxCacheSize: this.maxCacheSize,
      memoryThresholds: {
        cleanup: (this.maxMemoryUsageRatio * 100).toFixed(0) + '%',
        emergency: (this.emergencyCleanupThreshold * 100).toFixed(0) + '%'
      },
      
      // 상세 정보
      blobDetails: Array.from(this.globalBlobCache.entries()).map(([fileHash, descriptor]) => ({
        fileHash,
        refCount: descriptor.refCount,
        sizeMB: descriptor.fileSize ? (descriptor.fileSize / 1024 / 1024).toFixed(2) : 'N/A',
        ageMinutes: ((Date.now() - descriptor.createdAt) / 1000 / 60).toFixed(1),
        lastUsedMinutes: ((Date.now() - descriptor.lastUsedAt) / 1000 / 60).toFixed(1)
      })),
      
      // 레거시 호환성 (사용하지 않음)
      audioCacheSize: 0,
      blobUrlCacheSize: this.globalBlobCache.size,
      routeBlobsSize: 0,
      activeTimers: 0
    };
  }

  /**
   * 프리로드 (메모리 효율적)
   */
  async preloadAudio(urls: string[]): Promise<void> {
    console.log('🔄 AudioService - Preloading audio files:', urls.length);
    
    const preloadPromises = urls.map(async (url) => {
      try {
        await this.getAudioBlobUrl(url);
        console.log('✅ AudioService - Preloaded:', url);
      } catch (error) {
        console.warn(`❌ AudioService - Preload failed for ${url}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    
    console.log('✅ AudioService - Preload completed');
  }

  /**
   * 레거시 호환성을 위한 라우트 관리 (더 이상 사용되지 않음)
   */
  setCurrentRoute(route: string): void {
    console.log('ℹ️ AudioService - Route-based caching is no longer used (global caching enabled)');
  }

  cleanupRouteBlobs(route: string): void {
    console.log('ℹ️ AudioService - Route-based cleanup is no longer needed (reference counting enabled)');
  }

  cleanupPreviousRoutes(): void {
    console.log('ℹ️ AudioService - Previous route cleanup is automatic (zero-latency cleanup enabled)');
  }
}

// 싱글톤 인스턴스 내보내기
export const audioService = AudioService.getInstance();