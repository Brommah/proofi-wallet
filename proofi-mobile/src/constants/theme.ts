/**
 * Proofi Design System — Brutalist Dark Theme
 *
 * The design language is sharp, monochrome with neon accents.
 * No border-radius on primary elements. Square is brutal.
 */

export const Colors = {
  // Backgrounds
  black: '#000000',
  surface: '#0A0A0A',
  surfaceLight: '#111111',
  card: '#1A1A1A',

  // Neon accents
  cyan: '#00E5FF',
  green: '#00FF88',
  magenta: '#FF3366',
  amber: '#FFB800',
  yellow: '#FFE100',
  purple: '#A855F7',
  blue: '#3B82F6',

  // Text
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8A8A',
  textTertiary: '#4A4A4A',
  textMuted: '#2A2A2A',

  // Borders
  border: '#1A1A1A',
  borderLight: '#2A2A2A',
  borderActive: '#00E5FF',

  // Feedback
  success: '#00FF88',
  error: '#FF3366',
  warning: '#FFB800',
  info: '#00E5FF',

  // Additional accent colors (for audit chain)
  red: '#FF3366',
  pink: '#FF6B9D',
  gold: '#FFD700',

  // Opacity helpers
  cyanAlpha: (opacity: number) => `rgba(0, 229, 255, ${opacity})`,
  greenAlpha: (opacity: number) => `rgba(0, 255, 136, ${opacity})`,
  magentaAlpha: (opacity: number) => `rgba(255, 51, 102, ${opacity})`,
  redAlpha: (opacity: number) => `rgba(255, 51, 102, ${opacity})`,
  amberAlpha: (opacity: number) => `rgba(255, 184, 0, ${opacity})`,
  purpleAlpha: (opacity: number) => `rgba(168, 85, 247, ${opacity})`,
} as const;

// System font fallbacks — replace with custom fonts once bundled
import { Platform } from 'react-native';

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const display = Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium', default: 'sans-serif' });

export const Fonts = {
  display,
  displayMedium: display,
  displayRegular: Platform.select({ ios: 'Avenir', android: 'sans-serif', default: 'sans-serif' }),
  mono,
  monoBold: Platform.select({ ios: 'Menlo-Bold', android: 'monospace', default: 'monospace' }),
  monoMedium: mono,
  body: mono,
  label: mono,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  display: 48,
} as const;

export const BorderWidth = {
  thin: 1,
  medium: 2,
  thick: 3,
} as const;
