import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ──────────────────────────────────────────────
// Color Palettes (from design.md)
// ──────────────────────────────────────────────
export const lightColors = {
  // Surfaces
  surface:       '#ffffff',
  surfaceSoft:   '#f5f5f0',
  surfaceMuted:  '#eceae6',
  surfaceDeep:   '#e0deda',
  // Text / Ink
  ink:           '#222022',
  inkSoft:       '#3a383a',
  inkMuted:      '#6b696b',
  inkGhost:      '#9e9c9e',
  // Brand
  primary:       '#c3d809',
  primaryDim:    '#9faf07',
  primaryGhost:  '#c3d80920',
  primaryBorder: '#c3d80960',
  // Feedback
  success:       '#2d9e5f',
  successGhost:  '#2d9e5f18',
  warning:       '#d4820a',
  warningGhost:  '#d4820a18',
  error:         '#d93651',
  errorGhost:    '#d9365118',
  info:          '#3a7ef5',
  infoGhost:     '#3a7ef518',
  // Misc
  isDark: false,
};

export const darkColors = {
  // Surfaces (inverted per design.md Dark Mode spec)
  surface:       '#222022',
  surfaceSoft:   '#2e2c2e',
  surfaceMuted:  '#3a383a',
  surfaceDeep:   '#4f4d4f',
  // Text / Ink (inverted)
  ink:           '#f0f0ec',
  inkSoft:       '#c8c6c8',
  inkMuted:      '#9e9c9e',
  inkGhost:      '#6b696b',
  // Brand (unchanged — primary stays electric)
  primary:       '#c3d809',
  primaryDim:    '#9faf07',
  primaryGhost:  '#c3d80930',
  primaryBorder: '#c3d80970',
  // Feedback (unchanged)
  success:       '#2d9e5f',
  successGhost:  '#2d9e5f30',
  warning:       '#d4820a',
  warningGhost:  '#d4820a30',
  error:         '#d93651',
  errorGhost:    '#d9365130',
  info:          '#3a7ef5',
  infoGhost:     '#3a7ef530',
  // Misc
  isDark: true,
};

export type ThemeColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('@app_theme_mode');
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (e) {
        console.error('Failed to load theme mode', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('@app_theme_mode', mode);
    } catch (e) {
      console.error('Failed to save theme mode', e);
    }
  };

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  // Render nothing or a splash screen while loading to prevent theme flashing
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ colors, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
