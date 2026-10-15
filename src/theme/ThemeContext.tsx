/**
 * Theme context and hook for accessing theme values throughout the app
 * Provides colors, spacing, typography, and color scheme
 */

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, getColors, ColorScheme } from './colors';
import { spacing, spacingPresets, SpacingPresetKey } from './spacing';
import { typography, semanticTypography, TypographyKey, SemanticTypographyKey } from './typography';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  spacingPresets: typeof spacingPresets;
  typography: typeof typography;
  semanticTypography: typeof semanticTypography;
  colorScheme: ColorScheme;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  initialColorScheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, initialColorScheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const colorScheme = initialColorScheme ?? systemColorScheme ?? 'light';
  
  // In a real app, you might persist this to AsyncStorage
  // For now, we just use the system color scheme
  
  const theme = useMemo((): Theme => {
    const isDark = colorScheme === 'dark';
    const colors = getColors(colorScheme);
    
    return {
      colors,
      spacing,
      spacingPresets,
      typography,
      semanticTypography,
      colorScheme,
      isDark,
    };
  }, [colorScheme]);
  
  const toggleColorScheme = () => {
    // In a full implementation, this would update AsyncStorage
    // and trigger a re-render with the new color scheme
    console.log('Toggle color scheme - would persist to storage');
  };
  
  const setColorScheme = (scheme: ColorScheme) => {
    // Would persist to storage
    console.log('Set color scheme:', scheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleColorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context.theme;
}

export function useColorSchemeTheme(): ColorScheme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useColorSchemeTheme must be used within a ThemeProvider');
  }
  return context.theme.colorScheme;
}

export function useColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}

export function useSpacing() {
  return useTheme().spacing;
}

export function useSpacingPresets() {
  return useTheme().spacingPresets;
}

export function useTypography() {
  return useTheme().typography;
}

export function useSemanticTypography() {
  return useTheme().semanticTypography;
}

// Helper hooks for common theme values
export function useColor(key: keyof ThemeColors): string {
  const colors = useColors();
  return colors[key];
}

export function useSpacingPreset(key: keyof typeof spacingPresets): number {
  return spacingPresets[key];
}

export function useTypographyStyle(key: keyof typeof typography) {
  const { typography } = useTheme();
  return typography[key];
}

export function useSemanticTypographyStyle(key: keyof typeof semanticTypography) {
  const { semanticTypography } = useTheme();
  return semanticTypography[key];
}

// Convenience hook for common theme combinations
export function useThemeStyles() {
  const { colors, spacing, spacingPresets, typography, semanticTypography } = useTheme();
  
  const styles = useMemo(function() {
    // Colors
    const result = {
      colors,
      
      // Common spacing
      screenPadding: spacingPresets.screenPadding,
      cardPadding: spacingPresets.cardPadding,
      componentGap: spacingPresets.componentGap,
      sectionGap: spacingPresets.sectionGap,
      
      // Border radius
      borderRadiusSm: spacingPresets.borderRadiusSm,
      borderRadiusMd: spacingPresets.borderRadiusMd,
      borderRadiusLg: spacingPresets.borderRadiusLg,
      borderRadiusXl: spacingPresets.borderRadiusXl,
      borderRadiusFull: spacingPresets.borderRadiusFull,
      
      // Typography
      textStyles: {
        screenTitle: semanticTypography.screenTitle,
        sectionTitle: semanticTypography.sectionTitle,
        cardTitle: semanticTypography.cardTitle,
        body: semanticTypography.body,
        bodySecondary: semanticTypography.bodySecondary,
        caption: semanticTypography.caption,
        button: semanticTypography.buttonPrimary,
        buttonSecondary: semanticTypography.buttonSecondary,
        label: semanticTypography.label,
        input: semanticTypography.input,
        placeholder: semanticTypography.placeholder,
        helperText: semanticTypography.helperText,
        errorText: semanticTypography.errorText,
        statValue: semanticTypography.statValue,
        statLabel: semanticTypography.statLabel,
        timestamp: semanticTypography.timestamp,
        metadata: semanticTypography.metadata,
      },
      
      // Common component styles
      card: {
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        borderRadius: spacingPresets.borderRadiusLg,
        padding: spacingPresets.cardPadding,
      },
      cardElevated: {
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        borderRadius: spacingPresets.borderRadiusLg,
        padding: spacingPresets.cardPadding,
        ...{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
      },
      buttonPrimary: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      input: {
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.textPrimary,
      },
      inputFocused: {
        borderColor: colors.inputBorderFocus,
      },
    };
    return result;
  }, [colors, spacingPresets]);
  
  return styles;
}