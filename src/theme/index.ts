/**
 * Theme palettes. The default `theme` export is light — every screen
 * imports it as a static module and that stays correct as long as the
 * user is on the light scheme. Dark colors live in `darkColors` and
 * are surfaced via the `useThemeColors()` hook for callers that need
 * to render against the active scheme.
 *
 * A full retrofit (every screen consuming `useThemeColors()`) is a
 * Phase 11 follow-up — too large for one branch. What ships here:
 *
 *   - StatusBar + NavigationContainer respect the active scheme via
 *     the navigation theme that App.tsx selects with useThemeColors()
 *   - Settings → Appearance row lets the user override system / light
 *     / dark, persisted across launches
 *   - The shared `theme.colors` import keeps working for static
 *     stylesheets — they render in light colors regardless. Migrating
 *     a screen is opt-in: replace `theme.colors.x` with
 *     `useThemeColors().x` inside the component
 */

type Palette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primaryText: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

const lightColors: Palette = {
  background: '#FFFFFF',
  surface: '#F7F7F8',
  text: '#0A0A0B',
  muted: '#6B6B72',
  primary: '#FF3B5C',
  primaryText: '#FFFFFF',
  border: '#E5E5EA',
  success: '#1AAB5A',
  warning: '#E8A500',
  danger: '#D7263D',
};

const darkColors: Palette = {
  background: '#0E0E10',
  surface: '#1B1B20',
  text: '#F4F4F6',
  muted: '#9C9CA8',
  primary: '#FF6B82',
  primaryText: '#0E0E10',
  border: '#2A2A30',
  success: '#3CD27D',
  warning: '#FFC15C',
  danger: '#FF6B6B',
};

export const theme = {
  colors: lightColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    heading: 24,
    title: 18,
    body: 16,
    caption: 13,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = Palette;

export const palettes = {
  light: lightColors,
  dark: darkColors,
} as const;

export type PaletteName = keyof typeof palettes;
