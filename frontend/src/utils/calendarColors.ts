/**
 * 캘린더 색상 관리 유틸리티
 * - 백엔드와 동일한 색상 팔레트 유지
 * - 색상 인덱스 기반 매핑
 */

export interface CalendarColor {
  index: number;
  hex: string;
  name: string;
  tailwindBg: string;
  tailwindText: string;
  tailwindBorder: string;
  lightBg: string; // 20% 투명도 배경용
}

/**
 * 기본 색상 배열 (백엔드 CalendarColorManager와 동일)
 */
export const CALENDAR_COLORS: CalendarColor[] = [
  {
    index: 0,
    hex: '#FFB800',
    name: 'Yellow',
    tailwindBg: 'bg-yellow-500',
    tailwindText: 'text-yellow-700',
    tailwindBorder: 'border-yellow-300',
    lightBg: '#FFB80033' // 20% 투명도
  },
  {
    index: 1,
    hex: '#FF6B6B',
    name: 'Red',
    tailwindBg: 'bg-red-500',
    tailwindText: 'text-red-700',
    tailwindBorder: 'border-red-300',
    lightBg: '#FF6B6B33'
  },
  {
    index: 2,
    hex: '#4ECDC4',
    name: 'Teal',
    tailwindBg: 'bg-teal-500',
    tailwindText: 'text-teal-700',
    tailwindBorder: 'border-teal-300',
    lightBg: '#4ECDC433'
  },
  {
    index: 3,
    hex: '#45B7D1',
    name: 'Blue',
    tailwindBg: 'bg-blue-500',
    tailwindText: 'text-blue-700',
    tailwindBorder: 'border-blue-300',
    lightBg: '#45B7D133'
  },
  {
    index: 4,
    hex: '#96CEB4',
    name: 'Green',
    tailwindBg: 'bg-green-500',
    tailwindText: 'text-green-700',
    tailwindBorder: 'border-green-300',
    lightBg: '#96CEB433'
  },
  {
    index: 5,
    hex: '#FFEAA7',
    name: 'Light Yellow',
    tailwindBg: 'bg-yellow-300',
    tailwindText: 'text-yellow-800',
    tailwindBorder: 'border-yellow-200',
    lightBg: '#FFEAA733'
  },
  {
    index: 6,
    hex: '#DDA0DD',
    name: 'Plum',
    tailwindBg: 'bg-purple-400',
    tailwindText: 'text-purple-700',
    tailwindBorder: 'border-purple-300',
    lightBg: '#DDA0DD33'
  },
  {
    index: 7,
    hex: '#98D8C8',
    name: 'Mint',
    tailwindBg: 'bg-emerald-400',
    tailwindText: 'text-emerald-700',
    tailwindBorder: 'border-emerald-300',
    lightBg: '#98D8C833'
  }
];

/**
 * 색상 인덱스로 색상 정보 반환
 */
export const getCalendarColor = (colorIndex: number): CalendarColor => {
  if (colorIndex < 0 || colorIndex >= CALENDAR_COLORS.length) {
    return CALENDAR_COLORS[0];
  }
  return CALENDAR_COLORS[colorIndex];
};

/**
 * 색상 인덱스로 HEX 색상 반환
 */
export const getCalendarHex = (colorIndex: number): string => {
  return getCalendarColor(colorIndex).hex;
};

/**
 * 색상 인덱스로 색상 이름 반환
 */
export const getCalendarName = (colorIndex: number): string => {
  return getCalendarColor(colorIndex).name;
};

/**
 * 색상 인덱스로 Tailwind 배경 클래스 반환
 */
export const getCalendarBgClass = (colorIndex: number): string => {
  return getCalendarColor(colorIndex).tailwindBg;
};

/**
 * 색상 인덱스로 Tailwind 텍스트 클래스 반환
 */
export const getCalendarTextClass = (colorIndex: number): string => {
  return getCalendarColor(colorIndex).tailwindText;
};

/**
 * 색상 인덱스로 Tailwind 테두리 클래스 반환
 */
export const getCalendarBorderClass = (colorIndex: number): string => {
  return getCalendarColor(colorIndex).tailwindBorder;
};

/**
 * 색상 인덱스로 반투명 배경 색상 반환 (인라인 스타일용)
 */
export const getCalendarLightBg = (colorIndex: number): string => {
  return getCalendarColor(colorIndex).lightBg;
};

/**
 * 색상 인덱스 유효성 검증
 */
export const isValidColorIndex = (colorIndex: number): boolean => {
  return colorIndex >= 0 && colorIndex < CALENDAR_COLORS.length;
};

/**
 * 총 사용 가능한 색상 개수 반환
 */
export const getTotalColorCount = (): number => {
  return CALENDAR_COLORS.length;
};

/**
 * 모든 색상 정보 반환
 */
export const getAllColors = (): CalendarColor[] => {
  return [...CALENDAR_COLORS];
};

/**
 * 다중 캘린더의 색상을 스트라이프 패턴으로 표시하기 위한 그라디언트 생성
 */
export const createStripeGradient = (colorIndexes: number[]): string => {
  if (colorIndexes.length === 0) return 'transparent';
  if (colorIndexes.length === 1) return getCalendarLightBg(colorIndexes[0]);

  const colors = colorIndexes.map(index => getCalendarHex(index));
  const stripeWidth = 100 / colors.length;
  
  const gradientStops: string[] = [];
  
  colors.forEach((color, index) => {
    const start = index * stripeWidth;
    const end = (index + 1) * stripeWidth;
    gradientStops.push(`${color} ${start}%`);
    gradientStops.push(`${color} ${end}%`);
  });

  return `linear-gradient(90deg, ${gradientStops.join(', ')})`;
};

/**
 * 캘린더 이벤트의 표시 스타일 반환 (Google Calendar 스타일)
 */
export const getEventDisplayStyle = (
  colorIndex: number,
  isMultiple: boolean = false
): React.CSSProperties => {
  const color = getCalendarColor(colorIndex);
  
  if (isMultiple) {
    // 다중 캘린더인 경우 좌측 색상 바 스타일
    return {
      borderLeft: `4px solid ${color.hex}`,
      backgroundColor: '#F9FAFB',
      color: '#374151'
    };
  }
  
  // 단일 캘린더인 경우 전체 배경 스타일
  return {
    backgroundColor: color.lightBg,
    color: color.tailwindText.replace('text-', '#'),
    border: `1px solid ${color.hex}40`
  };
};

/**
 * ICS 모바일 리스트용 이벤트 스타일 반환
 */
export const getICSEventStyle = (colorIndex?: number): {
  containerStyle: React.CSSProperties;
  dotStyle: React.CSSProperties;
} => {
  // colorIndex가 없거나 유효하지 않은 경우 기본 emerald 색상 사용
  if (colorIndex === undefined || !isValidColorIndex(colorIndex)) {
    return {
      containerStyle: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // emerald-500 10% 투명도
        borderColor: 'rgba(16, 185, 129, 0.3)'      // emerald-500 30% 투명도
      },
      dotStyle: {
        backgroundColor: '#10b981' // emerald-500
      }
    };
  }

  const color = getCalendarColor(colorIndex);
  return {
    containerStyle: {
      backgroundColor: `${color.hex}1A`, // 10% 투명도
      borderColor: `${color.hex}4D`      // 30% 투명도  
    },
    dotStyle: {
      backgroundColor: color.hex
    }
  };
};

/**
 * 날짜별 다중 캘린더 색상 점 스타일 반환
 */
export const getCalendarDotStyle = (colorIndex: number): React.CSSProperties => {
  const color = getCalendarColor(colorIndex);
  return {
    backgroundColor: color.hex,
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0
  };
};

/**
 * HEX 색상에서 가장 가까운 색상 인덱스 찾기
 */
export const findClosestColorIndex = (hexColor?: string): number => {
  if (!hexColor) return 0; // 기본값
  
  // 정확히 일치하는 색상 찾기
  const exactMatch = CALENDAR_COLORS.find(color => 
    color.hex.toLowerCase() === hexColor.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch.index;
  }
  
  // 일치하는 색상이 없으면 기본 색상(0) 반환
  return 0;
};

/**
 * 캘린더 스트라이프 바 스타일 반환 (새로운 디자인)
 */
export const getCalendarStripeStyle = (colorIndex: number): React.CSSProperties => {
  const color = getCalendarColor(colorIndex);
  return {
    backgroundColor: color.hex,
    minWidth: '4px',
    height: '4px',
    borderRadius: '1px',
    border: '0.5px solid rgba(255,255,255,0.8)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    flexGrow: 1,
    flexShrink: 0
  };
};

/**
 * 향상된 색상 점 스타일 (시인성 개선)
 */
export const getEnhancedCalendarDotStyle = (colorIndex: number): React.CSSProperties => {
  const color = getCalendarColor(colorIndex);
  return {
    backgroundColor: color.hex,
    width: '8px',
    height: '8px', 
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    flexShrink: 0
  };
};

/**
 * 날짜 셀 배경 상태 스타일 반환
 */
export const getDateCellBackgroundStyle = (status: string): React.CSSProperties => {
  const styles = {
    available: {
      backgroundColor: 'transparent'
    },
    blocked: {
      backgroundColor: 'rgba(239, 68, 68, 0.05)',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    },
    busy: {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    }
  };
  
  return styles[status as keyof typeof styles] || styles.available;
};

/**
 * 반응형 표시 규칙 반환
 */
export const getDisplayRules = (
  viewMode: 'compact' | 'standard' | 'expanded', 
  isMobile: boolean
) => {
  const rules = {
    compact: {
      mobile: {
        showDateNumber: true,
        showStatusIcon: false,
        showEventCount: true,
        showCalendarColors: 'stripe' as const,
        maxCalendars: 3,
        minCellHeight: '36px'
      },
      desktop: {
        showDateNumber: true,
        showStatusIcon: true,
        showEventCount: true,
        showCalendarColors: 'stripe' as const,
        maxCalendars: 4,
        minCellHeight: '40px'
      }
    },
    standard: {
      mobile: {
        showDateNumber: true,
        showStatusIcon: false,
        showEventCount: true,
        showCalendarColors: 'stripe' as const,
        maxCalendars: 4,
        minCellHeight: '44px'
      },
      desktop: {
        showDateNumber: true,
        showStatusIcon: true,
        showEventCount: true,
        showCalendarColors: 'both' as const,
        maxCalendars: 5,
        minCellHeight: '48px'
      }
    },
    expanded: {
      mobile: {
        showDateNumber: true,
        showStatusIcon: true,
        showEventCount: true,
        showCalendarColors: 'both' as const,
        maxCalendars: 5,
        minCellHeight: '52px'
      },
      desktop: {
        showDateNumber: true,
        showStatusIcon: true,
        showEventCount: true,
        showCalendarColors: 'both' as const,
        maxCalendars: 6,
        minCellHeight: '56px'
      }
    }
  };
  
  return rules[viewMode][isMobile ? 'mobile' : 'desktop'];
};

/**
 * HEX 색상을 RGB로 변환
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * 상대 명도 계산 (WCAG 2.1 기준)
 */
const getLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const getRGBForLuminance = (value: number): number => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const r = getRGBForLuminance(rgb.r);
  const g = getRGBForLuminance(rgb.g);
  const b = getRGBForLuminance(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * 색상 대비비 계산 (WCAG 2.1 기준)
 */
const calculateContrastRatio = (foregroundHex: string, backgroundHex: string): number => {
  const foregroundRgb = hexToRgb(foregroundHex);
  const backgroundRgb = hexToRgb(backgroundHex);
  
  if (!foregroundRgb || !backgroundRgb) return 1;
  
  const foregroundLuminance = getLuminance(foregroundRgb);
  const backgroundLuminance = getLuminance(backgroundRgb);
  
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG 2.1 AA 기준 대비비 검증 (최소 3:1)
 */
export const validateColorContrast = (foregroundHex: string, backgroundHex: string = '#FFFFFF'): boolean => {
  const contrast = calculateContrastRatio(foregroundHex, backgroundHex);
  return contrast >= 3.0;
};

/**
 * 접근성 준수 색상 스타일 반환
 */
export const getAccessibleColorStyle = (
  colorIndex: number, 
  backgroundColor: string = '#FFFFFF'
): React.CSSProperties => {
  const color = getCalendarColor(colorIndex);
  const hasGoodContrast = validateColorContrast(color.hex, backgroundColor);
  
  return {
    backgroundColor: color.hex,
    // 대비가 부족한 경우 테두리 추가
    border: hasGoodContrast 
      ? '0.5px solid rgba(255,255,255,0.8)' 
      : '1px solid rgba(0,0,0,0.3)',
    // 그림자로 깊이감 표현
    boxShadow: backgroundColor === '#FFFFFF'
      ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
      : '0 1px 3px rgba(255,255,255,0.12)',
    // 호버 효과
    transition: 'transform 0.1s ease, box-shadow 0.1s ease'
  };
};

/**
 * 향상된 캘린더 스트라이프 바 (접근성 적용)
 */
export const getAccessibleStripeStyle = (
  colorIndex: number,
  backgroundColor: string = '#FFFFFF'
): React.CSSProperties => {
  const baseStyle = getCalendarStripeStyle(colorIndex);
  const accessibleStyle = getAccessibleColorStyle(colorIndex, backgroundColor);
  
  return {
    ...baseStyle,
    ...accessibleStyle,
    minWidth: '6px', // 더 큰 터치 영역
    height: '4px'
  };
};

/**
 * 향상된 색상 점 (접근성 적용)
 */
export const getAccessibleDotStyle = (
  colorIndex: number,
  backgroundColor: string = '#FFFFFF'
): React.CSSProperties => {
  const baseStyle = getEnhancedCalendarDotStyle(colorIndex);
  const accessibleStyle = getAccessibleColorStyle(colorIndex, backgroundColor);
  
  return {
    ...baseStyle,
    ...accessibleStyle,
    width: '10px', // 더 큰 크기
    height: '10px',
    minWidth: '10px',
    minHeight: '10px'
  };
};