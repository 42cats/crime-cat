/**
 * 오디오 관련 타입 정의
 */

export interface AudioMetadata {
  title: string;
  duration?: number;
  fileSize?: number;
  contentType?: string;
  isPrivate?: boolean;
}

export interface AudioToken {
  type: 'internal' | 'external' | 'legacy';
  title: string;
  url: string;
  metadata?: AudioMetadata;
  originalMatch: string;
  position: [number, number];
  tempId?: string;
}

export interface ParsedContent {
  content: string;
  audioTokens: AudioToken[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  type?: 'internal' | 'external';
}

export interface ResolvedAudio {
  blobUrl: string;
  metadata: AudioMetadata;
  cacheKey: string;
  expiresAt: Date;
}

export interface CachedAudio {
  blobUrl: string;
  metadata: AudioMetadata;
  timestamp: Date;
  accessCount: number;
}

export interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  memoryUsage: number;
}