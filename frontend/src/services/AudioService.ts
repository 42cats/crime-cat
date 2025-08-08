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
  
  // 글로벌 Blob URL 캐시 (LRU 방식으로 관리)
  private globalBlobCache = new Map<string, BlobDescriptor>();
  private lruOrder: string[] = []; // LRU 순서 추적
  
  // 참조 카운팅 (컴포넌트별 사용 추적)
  private referenceCounter = new Map<string, Set<string>>();
  
  // 메모리 관리 설정 (프로덕션 최적화)
  private readonly maxCacheSize = 15; // 메모리 절약을 위해 감소
  private readonly maxMemoryUsageRatio = 0.85; // 85% 이상 시 정리
  private readonly emergencyCleanupThreshold = 0.98; // 98% 이상 시 긴급 정리 (프로덕션 표준)
  
  // 메모리 모니터링
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMemoryMonitoring();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * 스마트 메모리 모니터링 시작 (프로덕션 최적화)
   */
  private startMemoryMonitoring(): void {
    // 페이지 로드 완료 후 모니터링 시작
    if (document.readyState === 'complete') {
      this.initializeMonitoring();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.initializeMonitoring(), 10000); // 10초 후 시작
      });
    }
  }

  /**
   * 모니터링 초기화
   */
  private initializeMonitoring(): void {
    // 60초마다 백그라운드 메모리 상태 확인 (프로덕션 표준)
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 60000);
    
  }

  /**
   * 파일 URL에서 해시 생성 (충돌 방지를 위한 개선된 해시 함수)
   */
  private generateFileHash(url: string): string {
    // 전체 URL을 사용하여 더 정확한 해시 생성
    const fullUrl = url.includes('http') ? url : `${window.location.origin}${url}`;
    
    // URL 객체를 사용하여 파일명과 경로 모두 포함
    try {
      const urlObj = new URL(fullUrl);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'unknown';
      const fullPath = `${pathname}_${filename}`;
      
      // 더 강력한 해시 생성 (경로 + 파일명 + 쿼리 파라미터)
      const hashSource = `${fullPath}_${urlObj.search || ''}`;
      const hash = btoa(encodeURIComponent(hashSource)).replace(/[^a-zA-Z0-9]/g, '');
      
      // 뒤쪽 16자 사용으로 파일명 고유성 확보
      const uniqueHash = hash.length >= 16 ? hash.slice(-16) : hash;
      
      
      return `hash_${uniqueHash}`;
    } catch (error) {
      // URL 파싱 실패 시 폴백
      const normalizedUrl = this.normalizeUrl(url);
      const fallbackHash = btoa(encodeURIComponent(normalizedUrl)).replace(/[^a-zA-Z0-9]/g, '');
      const uniqueFallback = fallbackHash.length >= 16 ? fallbackHash.slice(-16) : fallbackHash;
      return `hash_${uniqueFallback}`;
    }
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
      return this.httpCache.get(normalizedUrl)!;
    }

    // 새로운 요청 생성 및 캐시 저장
    const audioPromise = this.fetchAudioBlob(normalizedUrl);
    this.httpCache.set(normalizedUrl, audioPromise);

    // HTTP 캐시 크기 제한
    this.enforceHttpCacheSize();

    try {
      const blob = await audioPromise;
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


    // 기존 글로벌 Blob URL이 있는 경우 재사용
    if (this.globalBlobCache.has(fileHash)) {
      const descriptor = this.globalBlobCache.get(fileHash)!;
      
      // 참조 카운터 증가
      this.addReference(fileHash, compId);
      
      // 마지막 사용 시간 업데이트 및 LRU 순서 갱신
      descriptor.lastUsedAt = Date.now();
      this.updateLruOrder(fileHash);
      
      
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
      
      // 참조 카운터 증가 및 LRU 순서 갱신
      this.addReference(fileHash, compId);
      this.updateLruOrder(fileHash);
      
      // 캐시 크기 제한 적용
      this.enforceGlobalCacheSize();
      
      
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
    
  }

  /**
   * 참조 제거 (컴포넌트 언마운트 시) - 지연 정리로 타이밍 문제 해결
   */
  releaseReference(componentId: string): void {
    let releasedFiles: string[] = [];

    for (const [fileHash, components] of this.referenceCounter.entries()) {
      if (components.has(componentId)) {
        components.delete(componentId);
        
        const descriptor = this.globalBlobCache.get(fileHash);
        if (descriptor) {
          descriptor.refCount = components.size;
          

          // 참조 카운트가 0이면 지연 메모리 해제 (타이밍 문제 해결)
          if (descriptor.refCount === 0) {
            setTimeout(() => {
              // 다시 한 번 참조 카운트 확인 (새로운 컴포넌트가 사용하기 시작했을 수 있음)
              const currentDescriptor = this.globalBlobCache.get(fileHash);
              if (currentDescriptor && currentDescriptor.refCount === 0) {
                this.immediateCleanup(fileHash);
              } else {
              }
            }, 500); // 500ms 지연으로 컴포넌트 라이프사이클과 충돌 방지
            
            releasedFiles.push(fileHash);
          }
        }
      }
    }

    if (releasedFiles.length > 0) {
    }
  }

  /**
   * 즉시 메모리 해제 (참조 카운트 0인 경우)
   */
  private immediateCleanup(fileHash: string): void {
    const descriptor = this.globalBlobCache.get(fileHash);
    if (!descriptor) return;


    // Blob URL 해제
    URL.revokeObjectURL(descriptor.blobUrl);
    
    // 캐시에서 제거
    this.globalBlobCache.delete(fileHash);
    this.referenceCounter.delete(fileHash);
    
    // LRU 순서에서도 제거
    const lruIndex = this.lruOrder.indexOf(fileHash);
    if (lruIndex > -1) {
      this.lruOrder.splice(lruIndex, 1);
    }
    
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
      
      const response = await apiClient.get<Blob>(url, { 
        responseType: 'blob',
        timeout: 30000, // 30초 타임아웃
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'audio/*,*/*'
        }
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
    });
  }

  /**
   * LRU 순서 업데이트
   */
  private updateLruOrder(fileHash: string): void {
    // 기존 위치에서 제거
    const index = this.lruOrder.indexOf(fileHash);
    if (index > -1) {
      this.lruOrder.splice(index, 1);
    }
    
    // 맨 앞으로 이동 (가장 최근 사용)
    this.lruOrder.unshift(fileHash);
  }

  /**
   * 글로벌 캐시 크기 제한 (LRU 방식)
   */
  private enforceGlobalCacheSize(): void {
    if (this.globalBlobCache.size <= this.maxCacheSize) return;

    console.log('⚠️ AudioService - Global cache size limit reached, cleaning up LRU entries');

    // LRU 순서에서 가장 오래된 항목들부터 제거
    const itemsToRemove = this.lruOrder.slice(this.maxCacheSize - 5); // 여유분 5개 유지
    
    for (const fileHash of itemsToRemove) {
      const descriptor = this.globalBlobCache.get(fileHash);
      if (descriptor && descriptor.refCount === 0) {
        this.immediateCleanup(fileHash);
      }
    }
  }

  /**
   * 적응형 메모리 임계값 계산 (Netflix/Spotify 스타일)
   */
  private getAdaptiveMemoryThreshold(): { cleanup: number; emergency: number } {
    const isInitialLoad = performance.timing.loadEventEnd === 0 || (Date.now() - performance.timing.loadEventEnd < 15000);
    
    if (isInitialLoad) {
      // 초기 로딩 중에는 관대한 임계값
      return { cleanup: 0.90, emergency: 0.98 };
    } else {
      // 안정화 후에는 일반 임계값
      return { cleanup: 0.85, emergency: 0.95 };
    }
  }

  /**
   * 스마트 메모리 사용량 확인 (적응형 임계값)
   */
  private checkMemoryUsage(): void {
    try {
      const memoryInfo = this.getMemoryStats();
      if (!memoryInfo) return;

      const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
      const thresholds = this.getAdaptiveMemoryThreshold();
      
      console.log('📊 AudioService - Smart memory check:', {
        usageRatio: (usageRatio * 100).toFixed(1) + '%',
        usedMB: (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1),
        totalMB: (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1),
        globalBlobsCount: this.globalBlobCache.size,
        httpCacheCount: this.httpCache.size,
        thresholds: {
          cleanup: (thresholds.cleanup * 100).toFixed(0) + '%',
          emergency: (thresholds.emergency * 100).toFixed(0) + '%'
        }
      });

      // 적응형 긴급 정리
      if (usageRatio > thresholds.emergency) {
        this.emergencyCleanup();
      }
      // 적응형 일반 정리
      else if (usageRatio > thresholds.cleanup) {
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
   * 긴급 메모리 정리 (활성 컴포넌트 보호)
   */
  private emergencyCleanup(): void {
    console.log('🚨 AudioService - Emergency cleanup started (protecting active components)');

    let totalCleaned = 0;
    let protectedCount = 0;

    // 참조 카운트가 0인 항목만 정리 (활성 컴포넌트 보호)
    for (const [fileHash, descriptor] of this.globalBlobCache.entries()) {
      if (descriptor.refCount === 0) {
        URL.revokeObjectURL(descriptor.blobUrl);
        this.globalBlobCache.delete(fileHash);
        this.referenceCounter.delete(fileHash);
        
        // LRU 순서에서도 제거
        const lruIndex = this.lruOrder.indexOf(fileHash);
        if (lruIndex > -1) {
          this.lruOrder.splice(lruIndex, 1);
        }
        
        totalCleaned++;
      } else {
        protectedCount++;
      }
    }

    // HTTP 캐시는 안전하게 정리
    this.httpCache.clear();

    this.triggerGarbageCollection();

  }

  /**
   * 레거시 호환성을 위한 URL 캐시 무효화 (더 이상 사용되지 않음)
   */
  invalidateCache(url: string): void {
    const fileHash = this.generateFileHash(url);
    const descriptor = this.globalBlobCache.get(fileHash);
    
    if (descriptor && descriptor.refCount === 0) {
      this.immediateCleanup(fileHash);
    } else if (descriptor) {
    }
  }

  /**
   * 전체 캐시 정리 (레거시 호환성)
   */
  clearCache(): void {
    this.emergencyCleanup();
  }

  /**
   * 서비스 종료 시 정리
   */
  destroy(): void {
    
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
    
    const preloadPromises = urls.map(async (url) => {
      try {
        await this.getAudioBlobUrl(url);
      } catch (error) {
        console.warn(`❌ AudioService - Preload failed for ${url}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    
  }

  /**
   * 레거시 호환성을 위한 라우트 관리 (더 이상 사용되지 않음)
   */
  setCurrentRoute(): void {
  }

  cleanupRouteBlobs(): void {
  }

  cleanupPreviousRoutes(): void {
  }
}

// 싱글톤 인스턴스 내보내기
export const audioService = AudioService.getInstance();