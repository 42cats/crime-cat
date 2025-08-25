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
    console.warn(`Invalid color index: ${colorIndex}. Using default color (0).`);
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
  
  let gradientStops: string[] = [];
  
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