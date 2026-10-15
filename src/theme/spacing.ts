/**
 * Spacing scale for consistent spacing across the app
 * Based on 4px base unit (Material Design / iOS guidelines)
 */

export const spacing = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = typeof spacing[SpacingKey];

// Spacing utilities
export const getSpacing = (key: SpacingKey): number => spacing[key];

// Common spacing combinations
export const spacingPresets = {
  // Screen padding
  screenPadding: spacing.xl,
  screenPaddingHorizontal: spacing.xl,
  screenPaddingVertical: spacing.lg,
  
  // Card padding
  cardPadding: spacing.lg,
  cardPaddingSm: spacing.md,
  cardPaddingLg: spacing.xl,
  
  // Component spacing
  componentGap: spacing.md,
  componentGapSm: spacing.sm,
  componentGapLg: spacing.lg,
  
  // Section spacing
  sectionGap: spacing.xl,
  sectionGapSm: spacing.lg,
  
  // Inset
  insetSm: spacing.sm,
  insetMd: spacing.md,
  insetLg: spacing.lg,
  
  // Border radius
  borderRadiusSm: 4,
  borderRadiusMd: 8,
  borderRadiusLg: 12,
  borderRadiusXl: 16,
  borderRadiusFull: 9999,
  
  // Icon sizes
  iconXs: 12,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 28,
  iconXxl: 32,
  
  // Button heights
  buttonHeightSm: 36,
  buttonHeightMd: 48,
  buttonHeightLg: 56,
  
  // Input heights
  inputHeightSm: 36,
  inputHeightMd: 48,
  inputHeightLg: 56,
  
  // Header
  headerHeight: 56,
  tabBarHeight: 83,
};

export type SpacingPresetKey = keyof typeof spacingPresets;