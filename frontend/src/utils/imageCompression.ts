/**
 * 이미지 압축 및 리사이징 유틸리티
 * 업로드된 이미지를 JPEG 형식으로 변환하고 압축하거나 원하는 크기로 리사이징하는 기능을 제공합니다.
 */

// 압축 결과 타입 정의
export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRate: number; // 압축률 (0-100%)
}

// 압축 진행 상태 콜백 타입
export type CompressionProgressCallback = (progress: number) => void;

// 리사이징 모드 타입
export type ResizeMode = 'fit' | 'cover';

// 압축 및 리사이징 옵션 타입
export interface ImageCompressionOptions {
  maxSizeMB?: number;         // 최대 파일 크기 (MB)
  maxWidth?: number;          // 최대 너비 (픽셀)
  maxHeight?: number;         // 최대 높이 (픽셀)
  quality?: number;           // 이미지 품질 (0-1)
  onProgress?: CompressionProgressCallback; // 진행 상태 콜백
  
  // 리사이징 관련 옵션
  targetWidth?: number;       // 목표 너비 (픽셀)
  targetHeight?: number;      // 목표 높이 (픽셀)
  resizeMode?: ResizeMode;    // 리사이징 모드 ('fit' | 'cover')
  backgroundColor?: string;   // 배경색 (fit 모드에서 여백 채울 색상, 기본값: 흰색)
}

/**
 * 이미지 파일인지 확인
 * 
 * @param file 확인할 파일
 * @returns 이미지 파일 여부 (Promise<boolean>)
 */
export const isValidImageFile = (file: File): Promise<boolean> => {
  // MIME 타입으로 기본 체크
  if (!file.type.startsWith('image/')) {
    return Promise.resolve(false);
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(true);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };
    
    img.src = objectUrl;
  });
};

/**
 * 이미지를 Canvas API를 사용하여 JPEG으로 압축 및 리사이징
 * 
 * @param file 압축할 이미지 파일
 * @param options 압축 및 리사이징 옵션
 * @returns 압축 결과 객체 (Promise)
 */
export const compressImage = (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxSizeMB = 1,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.6,
    onProgress,
    targetWidth,
    targetHeight,
    resizeMode = 'fit',
    backgroundColor = '#FFFFFF'
  } = options;

  // 최대 파일 크기를 바이트로 변환
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // 리사이징이 필요 없고 이미 충분히 작은 파일이면서 JPEG인 경우 압축 스킵
  if (file.size <= maxSizeBytes && file.type === 'image/jpeg' && !targetWidth && !targetHeight) {
    return Promise.resolve({
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRate: 0
    });
  }

  return new Promise((resolve, reject) => {
    // 이미지 로딩 시작
    if (onProgress) onProgress(10);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      if (onProgress) onProgress(30);
      
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        if (onProgress) onProgress(50);
        
        // 이미지 크기 계산 (비율 유지하면서 리사이징)
        let width = img.width;
        let height = img.height;
        
        // 1. 먼저 최대 너비/높이로 리사이징 (압축 목적)
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        // 2. 타겟 너비/높이가 지정된 경우 추가 리사이징
        let canvasWidth = width;
        let canvasHeight = height;
        let offsetX = 0;
        let offsetY = 0;
        let drawWidth = width;
        let drawHeight = height;
        
        if (targetWidth && targetHeight) {
          canvasWidth = targetWidth;
          canvasHeight = targetHeight;
          
          if (resizeMode === 'fit') {
            // Fit 모드: 전체 이미지가 보이도록 조정 (비율 유지)
            const scaleX = targetWidth / width;
            const scaleY = targetHeight / height;
            const scale = Math.min(scaleX, scaleY);
            
            drawWidth = Math.round(width * scale);
            drawHeight = Math.round(height * scale);
            
            // 이미지 중앙 정렬
            offsetX = Math.round((targetWidth - drawWidth) / 2);
            offsetY = Math.round((targetHeight - drawHeight) / 2);
          } else if (resizeMode === 'cover') {
            // Cover 모드: 캔버스를 가득 채우도록 조정 (비율 유지, 이미지 일부 잘림)
            const scaleX = targetWidth / width;
            const scaleY = targetHeight / height;
            const scale = Math.max(scaleX, scaleY);
            
            drawWidth = Math.round(width * scale);
            drawHeight = Math.round(height * scale);
            
            // 이미지 중앙에서 잘라내기
            offsetX = Math.round((targetWidth - drawWidth) / 2);
            offsetY = Math.round((targetHeight - drawHeight) / 2);
          }
        }
        
        // Canvas 생성 및 이미지 그리기
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // 배경색으로 채우기 (JPEG는 투명도 지원 안함)
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 이미지 그리기
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        if (onProgress) onProgress(70);
        
        // JPEG로 변환
        canvas.toBlob(
          (blob) => {
            if (onProgress) onProgress(90);
            
            if (!blob) {
              reject(new Error('이미지 압축 실패: Canvas to Blob 변환 실패'));
              return;
            }
            
            // 파일명에서 확장자 변경
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            
            // 새 File 객체 생성
            const compressedFile = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            if (onProgress) onProgress(100);
            
            // 압축 결과 반환
            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRate: Math.round((1 - compressedFile.size / file.size) * 100)
            });
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('이미지 압축 실패: 이미지 로딩 오류'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('이미지 압축 실패: 파일 읽기 오류'));
    };
  });
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 * 
 * @param bytes 바이트 단위 크기
 * @param decimals 소수점 자릿수
 * @returns 포맷된 크기 문자열 (예: "1.5 MB")
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * 이미지를 지정된 크기로 리사이징하는 간편 함수
 * 원본 비율을 유지하면서 모든 내용이 보이도록 리사이징합니다.
 * 
 * @param file 원본 이미지 파일
 * @param width 목표 너비
 * @param height 목표 높이
 * @param options 추가 옵션 (품질, 배경색 등)
 * @returns 리사이징된 이미지 결과 객체 (Promise)
 */
export const resizeImage = (
  file: File,
  width: number,
  height: number,
  options: Omit<ImageCompressionOptions, 'targetWidth' | 'targetHeight'> = {}
): Promise<CompressionResult> => {
  return compressImage(file, {
    ...options,
    targetWidth: width,
    targetHeight: height,
    resizeMode: 'fit',
    quality: options.quality || 0.8  // 리사이징에서는 기본 품질을 더 높게 설정
  });
};

/**
 * 이미지 압축만 수행하는 간편 함수
 * 리사이징 없이 파일 크기만 축소합니다.
 * 
 * @param file 원본 이미지 파일
 * @param options 압축 옵션 (품질, 최대 크기 등)
 * @returns 압축된 이미지 결과 객체 (Promise)
 */
export const compressImageOnly = (
  file: File,
  options: {
    maxSizeMB?: number;
    quality?: number;
    onProgress?: CompressionProgressCallback;
  } = {}
): Promise<CompressionResult> => {
  // 리사이징 옵션 없이 압축만 수행
  return compressImage(file, {
    maxSizeMB: options.maxSizeMB || 1,
    quality: options.quality || 0.7,
    onProgress: options.onProgress
  });
};