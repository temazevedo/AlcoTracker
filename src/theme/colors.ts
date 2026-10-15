/**
 * Theme color palette for light and dark modes
 * Centralized color definitions for consistent theming
 */

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceElevated: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textOnPrimary: string;
  
  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Semantic colors
  success: string;
  successContainer: string;
  warning: string;
  warningContainer: string;
  error: string;
  errorContainer: string;
  info: string;
  infoContainer: string;
  
  // Border/divider colors
  border: string;
  divider: string;
  outline: string;
  
  // Shadow
  shadow: string;
  
  // Overlay
  overlay: string;
  backdrop: string;
  
  // Specific UI colors
  cardBackground: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputBorderFocus: string;
  placeholderText: string;
  disabledBackground: string;
  disabledText: string;
}

export const lightColors: ThemeColors = {
  // Background
  background: '#F5F5F5',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  
  // Primary
  primary: '#208AEF',
  primaryLight: '#64B5F6',
  primaryDark: '#1976D2',
  primaryContainer: '#E3F2FD',
  onPrimaryContainer: '#0D47A1',
  
  // Semantic
  success: '#4CAF50',
  successContainer: '#E8F5E9',
  warning: '#FF9800',
  warningContainer: '#FFF3E0',
  error: '#D32F2F',
  errorContainer: '#FFEBEE',
  info: '#2196F3',
  infoContainer: '#E3F2FD',
  
  // Borders
  border: '#E0E0E0',
  divider: '#E0E0E0',
  outline: '#BDBDBD',
  
  // Shadow
  shadow: '#000000',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
  
  // Specific UI
  cardBackground: '#FFFFFF',
  cardBorder: '#E0E0E0',
  inputBackground: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputBorderFocus: '#208AEF',
  placeholderText: '#9E9E9E',
  disabledBackground: '#F5F5F5',
  disabledText: '#BDBDBD',
};

export const darkColors: ThemeColors = {
  // Background
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2C2C2C',
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2C',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDBD',
  textTertiary: '#9E9E9E',
  textInverse: '#212121',
  textOnPrimary: '#FFFFFF',
  
  // Primary
  primary: '#64B5F6',
  primaryLight: '#90CAF9',
  primaryDark: '#42A5F5',
  primaryContainer: '#1565C0',
  onPrimaryContainer: '#E3F2FD',
  
  // Semantic
  success: '#81C784',
  successContainer: '#1B5E20',
  warning: '#FFB74D',
  warningContainer: '#E65100',
  error: '#EF5350',
  errorContainer: '#B71C1C',
  info: '#64B5F6',
  infoContainer: '#0D47A1',
  
  // Borders
  border: '#333333',
  divider: '#333333',
  outline: '#555555',
  
  // Shadow
  shadow: '#000000',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  
  // Specific UI
  cardBackground: '#1E1E1E',
  cardBorder: '#333333',
  inputBackground: '#2C2C2C',
  inputBorder: '#333333',
  inputBorderFocus: '#64B5F6',
  placeholderText: '#757575',
  disabledBackground: '#2C2C2C',
  disabledText: '#757575',
};

export function getColors(colorScheme: ColorScheme): ThemeColors {
  return colorScheme === 'dark' ? darkColors : lightColors;
}

// Color utility functions
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function hexToRgba(hex: string, alpha: number): string {
  return withOpacity(hex, alpha);
}

// Pre-defined shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  primary: {
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

export type ShadowStyle = typeof shadows.small;