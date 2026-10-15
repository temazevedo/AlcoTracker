/**
 * Typography scale for consistent text styling across the app
 * Based on Material Design / iOS Human Interface Guidelines
 */

export interface TypographyScale {
  // Display styles (largest)
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  displaySmall: TextStyle;
  
  // Headline styles
  headlineLarge: TextStyle;
  headlineMedium: TextStyle;
  headlineSmall: TextStyle;
  
  // Title styles
  titleLarge: TextStyle;
  titleMedium: TextStyle;
  titleSmall: TextStyle;
  
  // Body styles
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  
  // Label styles
  labelLarge: TextStyle;
  labelMedium: TextStyle;
  labelSmall: TextStyle;
  
  // Special
  button: TextStyle;
  caption: TextStyle;
  overline: TextStyle;
}

interface TextStyle {
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | '500' | '600' | '700';
  lineHeight: number;
  letterSpacing?: number;
  fontFamily?: string;
}

// Base font families (system fonts)
const fontFamily = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

// Line height multiplier (1.4-1.5 for readability)
const lineHeightMultiplier = 1.4;

export const typography = {
  // Display styles
  displayLarge: {
    fontSize: 57,
    fontWeight: 'bold' as const,
    lineHeight: Math.round(57 * 1.2),
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: 'bold' as const,
    lineHeight: Math.round(45 * 1.2),
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    lineHeight: Math.round(36 * 1.2),
    letterSpacing: 0,
  },
  
  // Headline styles
  headlineLarge: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: Math.round(32 * lineHeightMultiplier),
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: Math.round(28 * lineHeightMultiplier),
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: Math.round(24 * lineHeightMultiplier),
    letterSpacing: 0,
  },
  
  // Title styles
  titleLarge: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    lineHeight: Math.round(22 * lineHeightMultiplier),
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: Math.round(18 * lineHeightMultiplier),
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: Math.round(16 * lineHeightMultiplier),
    letterSpacing: 0.1,
  },
  
  // Body styles
  bodyLarge: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: Math.round(16 * lineHeightMultiplier),
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: Math.round(14 * lineHeightMultiplier),
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: Math.round(12 * lineHeightMultiplier),
    letterSpacing: 0.4,
  },
  
  // Label styles
  labelLarge: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: Math.round(14 * lineHeightMultiplier),
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: Math.round(12 * lineHeightMultiplier),
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: Math.round(11 * lineHeightMultiplier),
    letterSpacing: 0.5,
  },
  
  // Special styles
  button: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: Math.round(14 * lineHeightMultiplier),
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: Math.round(12 * lineHeightMultiplier),
    letterSpacing: 0.4,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: Math.round(10 * lineHeightMultiplier),
    letterSpacing: 1.5,
  },
} as const;

export type TypographyKey = keyof typeof typography;
export type TypographyStyle = typeof typography[TypographyKey];

// Text style helpers
export function getTypography(key: TypographyKey): TypographyStyle {
  return typography[key];
}

// Combined style creator
export function createTextStyle(
  base: TypographyStyle,
  overrides: Partial<TextStyle> = {}
): TextStyle {
  return {
    ...base,
    ...overrides,
    lineHeight: overrides.lineHeight ?? base.lineHeight,
  };
}

// Semantic text style mapping
export const semanticTypography = {
  // Screen titles
  screenTitle: typography.titleLarge,
  sectionTitle: typography.titleMedium,
  cardTitle: typography.titleSmall,
  
  // Body text
  body: typography.bodyLarge,
  bodySecondary: typography.bodyMedium,
  caption: typography.caption,
  
  // Interactive
  buttonPrimary: { ...typography.button, color: 'white' },
  buttonSecondary: typography.button,
  link: { ...typography.bodyMedium, textDecorationLine: 'underline' as const },
  
  // Form
  label: typography.labelMedium,
  input: typography.bodyLarge,
  placeholder: { ...typography.bodyLarge, color: 'placeholderText' },
  helperText: typography.caption,
  errorText: { ...typography.caption, color: 'error' },
  
  // Data display
  statValue: typography.headlineMedium,
  statLabel: typography.labelSmall,
  
  // Status
  success: { ...typography.bodyMedium, color: 'success' },
  warning: { ...typography.bodyMedium, color: 'warning' },
  error: { ...typography.bodyMedium, color: 'error' },
  
  // Metadata
  timestamp: typography.caption,
  metadata: typography.bodySmall,
};

export type SemanticTypographyKey = keyof typeof semanticTypography;