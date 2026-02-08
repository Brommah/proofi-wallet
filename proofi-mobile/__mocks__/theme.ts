// Shared theme mock for tests
export const Colors = {
  black: '#000000',
  white: '#FFFFFF',
  cyan: '#00E5FF',
  green: '#00FF88',
  magenta: '#FF3366',
  red: '#FF3366',
  purple: '#9945FF',
  amber: '#FFB800',
  blue: '#3B82F6',
  pink: '#EC4899',
  gold: '#F59E0B',
  yellow: '#FFE100',
  card: '#1A1A1A',
  surface: '#0A0A0A',
  surfaceLight: '#111111',
  border: '#1A1A1A',
  borderLight: '#333333',
  borderActive: '#00E5FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',
  textMuted: '#2A2A2A',
  success: '#00FF88',
  error: '#FF3366',
  warning: '#FFB800',
  info: '#00E5FF',
  cyanAlpha: (a: number) => `rgba(0, 229, 255, ${a})`,
  greenAlpha: (a: number) => `rgba(0, 255, 136, ${a})`,
  redAlpha: (a: number) => `rgba(255, 51, 102, ${a})`,
  magentaAlpha: (a: number) => `rgba(255, 51, 102, ${a})`,
  amberAlpha: (a: number) => `rgba(255, 184, 0, ${a})`,
  purpleAlpha: (a: number) => `rgba(168, 85, 247, ${a})`,
};

export const Fonts = {
  display: 'System',
  displayMedium: 'System',
  displayRegular: 'System',
  body: 'System',
  mono: 'Menlo',
  monoBold: 'Menlo',
  monoMedium: 'Menlo',
  label: 'System',
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  display: 48,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderWidth = {
  thin: 1,
  medium: 2,
  thick: 3,
};
