export const palette = {
  primary: '#0EA5E9',
  primaryDark: '#0369A1',
  primaryLight: '#22D3EE',
  success: '#22C55E',
  warning: '#FACC15',
  danger: '#EF4444',
  info: '#38BDF8',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#111827',
  border: '#334155',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5F5',
  muted: '#64748B'
};

export const theme = {
  colors: palette,
  spacing: (factor: number) => factor * 8,
  radius: {
    sm: 8,
    md: 12,
    lg: 20
  },
  typography: {
    title: 24,
    subtitle: 18,
    body: 16,
    small: 14
  }
};

export type Theme = typeof theme;
