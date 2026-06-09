// ShopBack 디자인시스템(sbds_*) 토큰 구조를 따름. brand primary 만 더블윈 색.
// 2026-06: 디자인 시안 "T3 Quiet Mono"(Toss 화이트 + 코랄) 채택 — accent 를 주황→코랄로 전환.

const BRAND = {
  primary: '#F0410E',       // 코랄 (Quiet Mono accent)
  primaryGlow: '#FFF0EB',   // 소프트 코랄 배경
  primaryTap: '#D63A0B',    // 눌림
  primaryDisabled: '#FAB39E',
  primaryLight: '#FB572F',  // 그라데이션 밝은 끝
} as const;

// Quiet Mono 디자인 토큰 — 새 T3 화면들이 공통으로 사용.
export const QM = {
  coral: '#F0410E',
  coralLight: '#FB572F',
  coralGrad: ['#FB572F', '#F0410E'] as const,
  coralSoft: '#FFF0EB',
  pageBg: '#F6F7F9',        // 라이트 그레이 앱 배경
  card: '#FFFFFF',
  ink: '#14161A',
  sub: '#8B9097',
  hairline: '#EEF0F2',
  fieldBg: '#F5F6F8',
  cardShadow: {
    shadowColor: '#141928',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;

const BRAND_SECONDARY = {
  babyBlue: '#6DD6FB',
  lemonYellow: '#FFD94E',
  lilac: '#9B77F7',
  mintGreen: '#7DE19C',
  rosePink: '#E97DCE',
} as const;

const COOL_GRAY = {
  5: '#F6F6F7',
  10: '#EFEFF1',
  15: '#DEE0E3',
  20: '#C6C9CF',
  30: '#AAADB6',
  40: '#8B909B',
  50: '#6A717F',
  60: '#535968',
  70: '#414856',
  80: '#323948',
  90: '#232938',
} as const;

const BLUE = {
  5: '#F1F7FF',
  10: '#C7DFFD',
  20: '#A0C6F9',
  30: '#67A4F7',
  40: '#3185FC',
  50: '#1673E8',
  60: '#0C5CC2',
  70: '#054AA7',
  80: '#003D91',
  90: '#142C63',
} as const;

export const TOKENS = {
  brand: BRAND,
  brandSecondary: BRAND_SECONDARY,
  font: {
    primary: COOL_GRAY[90],
    secondary: COOL_GRAY[50],
    inactive: COOL_GRAY[40],
    disabled: COOL_GRAY[30],
    placeholder: COOL_GRAY[40],
    inverse: '#FFFFFF',
    link: BLUE[50],
    linkDisabled: BLUE[20],
    error: '#E0311E',
    success: '#118658',
    warning: '#AF7800',
    trending: '#6161FF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: COOL_GRAY[5],
    dark: COOL_GRAY[90],
    transparent: 'transparent',
  },
  border: {
    subtle: COOL_GRAY[10],
    medium: COOL_GRAY[15],
  },
  data: {
    info: BLUE[50],
    success: '#36C096',
    warning: '#FFCA44',
  },
  status: {
    error:    { dark: '#E0311E', darker: '#C8120C', light: '#FFA8A5', lighter: '#FFE3E2' },
    info:     { dark: BLUE[50],  darker: BLUE[60],  light: BLUE[20],  lighter: BLUE[5]   },
    success:  { dark: '#118658', darker: '#176644', light: '#7DE19C', lighter: '#E5F6EB' },
    warning:  { dark: '#FFCA44', darker: '#7F5000', light: '#FFE5A6', lighter: '#FFF6DE' },
    trending: { dark: '#6161FF', darker: '#4B4BF4', light: '#B8B8FF', lighter: '#EEEEFF' },
    neutral:  { dark: COOL_GRAY[60], darker: COOL_GRAY[80], light: COOL_GRAY[15], lighter: COOL_GRAY[5] },
  },
  interaction: {
    primary: BRAND.primary,
    primaryTap: BRAND.primaryTap,
    primaryDisabled: BRAND.primaryDisabled,
    secondary: COOL_GRAY[5],
    secondaryTap: COOL_GRAY[10],
    danger: '#E0311E',
    dangerTap: '#C8120C',
    dangerDisabled: '#FFA8A5',
    link: BLUE[50],
    highlight: BLUE[5],
    highlightTap: BLUE[10],
  },
  coolGray: COOL_GRAY,
  blue: BLUE,
} as const;

// 호환 alias: 기존 COLORS 사용 코드가 깨지지 않도록 유지.
// 새 화면/컴포넌트는 TOKENS 를 직접 사용할 것.
export const COLORS = {
  primary: TOKENS.brand.primary,
  primaryDark: TOKENS.brand.primaryTap,
  primaryLight: TOKENS.brand.primaryLight,
  primarySoft: TOKENS.brand.primaryGlow,
  secondary: TOKENS.font.primary,
  background: TOKENS.background.primary,
  surface: TOKENS.background.secondary,
  white: '#FFFFFF',
  black: '#000000',
  ink: {
    900: COOL_GRAY[90],
    800: COOL_GRAY[80],
    700: COOL_GRAY[70],
    600: COOL_GRAY[60],
    500: COOL_GRAY[50],
    400: COOL_GRAY[40],
    300: COOL_GRAY[20],
    200: COOL_GRAY[15],
    100: COOL_GRAY[10],
    50:  COOL_GRAY[5],
  },
  gray: {
    100: COOL_GRAY[10],
    200: COOL_GRAY[15],
    300: COOL_GRAY[20],
    400: COOL_GRAY[30],
    500: COOL_GRAY[40],
    600: COOL_GRAY[50],
    700: COOL_GRAY[60],
    800: COOL_GRAY[70],
    900: COOL_GRAY[90],
  },
  divider: TOKENS.border.subtle,
  success: TOKENS.status.success.dark,
  warning: TOKENS.data.warning,
  error: TOKENS.status.error.dark,
  coupang: '#E4002B',
  naver: '#03C75A',
  eleventh: '#FF0038',
} as const;

// ShopBack 의 타이포 스케일에 맞춘 폰트 크기.
// (sbds 의 typography 토큰과 React Native dp 단위 매핑)
export const FONT = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 28,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
